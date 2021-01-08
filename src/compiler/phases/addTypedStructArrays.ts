import { Options } from "../Compiler";
import { traverse, skip } from "@glas/traverse"
import { Assembly, AssignmentExpression, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declarator, DotExpression, Expression, ExpressionStatement, ForStatement, FunctionExpression, Identifier, InstanceDeclarations, Literal, MemberExpression, Node, Parameter, Reference, ReturnStatement, ThisExpression, Type, TypeExpression, UnaryExpression, Variable, VariableDeclaration, YieldExpression } from "../ast";
import createScopeMaps, { NodeMap, ScopeMap } from "../createScopeMaps";
import { getOriginalDeclaration, SemanticError } from "../common";
import toCodeString from "../toCodeString";
import { IntegerTypes } from "../types";
import isConsequent from "../analysis/isConsequent";

/*
export data struct Vector
    var x: Number = 0
    var y: Number = 0
    static class Array
        x: Float64Array
        // y: Float64Array
        get(i: Integer) =>
            return new Vector(this.x[i], this.x[i + 1])
        set(i: Integer, value: Vector) =>
            this.x[i] = value.x
            this.y[i+1] = value.y
        [Symbol.iterator]() =>
            // iteration here
*/

let fieldTypes = {
    Float64: 8,
    Float32: 4,
    Int32: 4,
    Int16: 2,
    Int8: 1,
    UInt32: 4,
    UInt16: 2,
    UInt8: 1,
}
type FieldType = keyof typeof fieldTypes
type FieldInfo = { offset: number, type: FieldType | Reference, subfields?: FieldInfo[], name: string, path: string, actualField: number, actualOffset: number }
// let's start out WITHOUT recursion, then add that after
function getFieldType(type: Type | null, scopes: NodeMap<ScopeMap>, ancestors: Map<Node,Node>): FieldType | Reference {
    if (Reference.is(type)) {
        let fieldClass = getOriginalDeclaration(type, scopes, ancestors, ClassDeclaration.is)
        if (fieldClass != null) {
            return type
        }
        let variableDeclaration = getOriginalDeclaration(type, scopes, ancestors, VariableDeclaration.is)
        if (variableDeclaration != null) {
            if (variableDeclaration.kind !== "type") {
                throw SemanticError("Expected a type declaration", type)
            }
            type = variableDeclaration.value
        }
    }
    if (TypeExpression.is(type)) {
        for (let name in IntegerTypes) {
            let integerType = IntegerTypes[name]
            if (isConsequent(type, integerType)) {
                return name as any
            }
        }
    }
    return "Float64"
}
type ActualField = { name: string, type: FieldType, offset: number, stride: number }

function assignActualFields(
    fields: Array<FieldInfo>,
    actualFields = Array<ActualField>(),
) {
    let actualOffset = 0
    for (let field of fields) {
        // try to find a pre-existing field that works.
        let actualIndex = actualFields.findIndex(a => {
            if (a.type === field.type) {
                let relativeOffset = field.offset - a.offset
                let offsetByTypeSize = relativeOffset / fieldTypes[a.type]
                if (Number.isInteger(offsetByTypeSize)) {
                    actualOffset = offsetByTypeSize
                    return true
                }
            }
            return false
        })
        if (actualIndex < 0) {
            actualIndex = actualFields.length
            if (Reference.is(field.type)) {
                assignActualFields(field.subfields!, actualFields)
            }
            else {
                let actualField = { name: field.path, type: field.type, offset: field.offset, stride: -1 }
                actualFields.push(actualField)
            }
        }
        // set field info
        field.actualField = actualIndex
        field.actualOffset = actualOffset
    }
    return actualFields
}

function getFieldInfos(cls: ClassDeclaration, scopes: NodeMap<ScopeMap>, ancestors: Map<Node,Node>, offset: number, path: Array<string> = []): [Array<FieldInfo>, number] {
    let fields = new Array<FieldInfo>()
    for (let d of cls.instance.declarations) {
        if (d.kind === "var") {
            if (d.type == null) {
                throw SemanticError("Type required on data struct properties", d)
            }
            let { name } = d.id as Declarator
            let type = getFieldType(d.type, scopes, ancestors)
            let subfields: Array<FieldInfo> | undefined
            if (Reference.is(type)) {
                let fieldClass = getOriginalDeclaration(type, scopes, ancestors, ClassDeclaration.is)
                if (fieldClass == null) {
                    throw SemanticError(`Data struct not found`, type)
                }
                if (!fieldClass.isData || !fieldClass.isStruct) {
                    throw SemanticError(`Data struct fields can only be Numbers or data structs`, fieldClass.id)
                }
                let result = getFieldInfos(fieldClass, scopes, ancestors, offset, path.concat(name))
                subfields = result[0]
                offset = result[1]
            }
            fields.push({ name, path: (path.concat(name)).join('_'), offset, type, subfields, actualField: 0, actualOffset: 0 })
            if (!Reference.is(type)) {
                let fieldSize = fieldTypes[type]
                offset += fieldSize
            }
        }
    }
    return [fields, offset]
}

function createTypedArrayDeclaration(cls: ClassDeclaration, fields: FieldInfo[], actualFields: ActualField[], sizeInBytes: number, options: Options) {
    function createFieldGetterOrSetter(field: FieldInfo, setFrom?: Expression) {
        if (Reference.is(field.type)) {
            let { name } = field
            // field.name
            let subfields = field.subfields!.map(
                field => createFieldGetterOrSetter(
                    field,
                    setFrom
                        ? new MemberExpression({ object: setFrom, property: new Identifier({ name })})
                        : setFrom
                )
            )
            return setFrom ? subfields : new CallExpression({ new: true, callee: field.type, arguments: subfields })
        }
        let actualField = actualFields[field.actualField]
        let indexer = new BinaryExpression({
            left: new Reference({ name: "index" }),
            operator: "*",
            right: new Literal({ value: actualField.stride })
        })
        if (field.actualOffset > 0) {
            indexer = new BinaryExpression({
                left: indexer, operator: "+", right: new Literal({ value: field.actualOffset })
            })
        }
        let expression = new MemberExpression({
            object: new MemberExpression({
                object: new ThisExpression({}),
                property: new Identifier({ name: actualField.name })
            }),
            property: indexer
        })
        return setFrom ? new AssignmentExpression({
            left: expression,
            operator: "=",
            right: new MemberExpression({
                object: setFrom,
                property: new Identifier({ name: field.name })
            })
        }) : expression
    }
    // get function
    return new VariableDeclaration({
        static: new Identifier({ name: "static" }),
        kind: "var",
        id: new Declarator({ name: "Array" }),
        value: new ClassDeclaration({
            id: new Declarator({ name: `${cls.id.name}Array` }),
            instance: new InstanceDeclarations({
                declarations: [
                    // BEGIN CONSTRUCTOR
                    new VariableDeclaration({
                        kind: "let",
                        id: new Declarator({ name: "constructor" }),
                        value: new FunctionExpression({
                            params: [
                                new Parameter({
                                    id: new Declarator({ name: "length" }),
                                    type: new Reference({ name: "Integer" })
                                })
                            ],
                            body: new BlockStatement({
                                body: [
                                    new VariableDeclaration({
                                        kind: "let",
                                        id: new Declarator({ name: "buffer" }),
                                        value: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: "ArrayBuffer" }),
                                            arguments: [
                                                new BinaryExpression({
                                                    left: new Reference({ name: "length" }),
                                                    operator: "*",
                                                    right: new Literal({ value: sizeInBytes })
                                                })
                                            ]
                                        })
                                    }),
                                    new ExpressionStatement({
                                        expression: new AssignmentExpression({
                                            left: new MemberExpression({
                                                object: new ThisExpression({}),
                                                property: new Identifier({ name: "length" })
                                            }),
                                            right: new Reference({ name: "length" })
                                        }),
                                    }),
                                    ...actualFields.map(field => new ExpressionStatement({
                                        expression: new AssignmentExpression({
                                            left: new MemberExpression({
                                                object: new ThisExpression({}),
                                                property: new Identifier({ name: field.name })
                                            }),
                                            right: new CallExpression({
                                                new: true,
                                                callee: new Reference({ name: `${field.type}Array` }),
                                                arguments: [
                                                    new Reference({ name: "buffer" }),
                                                    new Literal({ value: field.offset }),
                                                ]
                                            })
                                        })
                                    })),
                                    options.debug ? new ExpressionStatement({
                                        expression: new CallExpression({
                                            callee: new MemberExpression({
                                                object: new Reference({ name: "Object" }),
                                                property: new Identifier({ name: "freeze" }),
                                            }),
                                            arguments: [new ThisExpression({})]
                                        })
                                    }) : []
                                ].flat()
                            })
                        })
                    }),
                    // BEGIN GETTER
                    new VariableDeclaration({
                        kind: "let",
                        id: new Declarator({ name: "get" }),
                        value: new FunctionExpression({
                            params: [
                                new Parameter({
                                    id: new Declarator({ name: "index" })
                                })
                            ],
                            body: new BlockStatement({
                                body: [
                                    new ReturnStatement({
                                        argument: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: cls.id.name }),
                                            arguments: fields.map(field => createFieldGetterOrSetter(field)),
                                        })
                                    })
                                ]
                            })
                        })
                    }),
                    // BEGIN SETTER
                    new VariableDeclaration({
                        kind: "let",
                        id: new Declarator({ name: "set" }),
                        value: new FunctionExpression({
                            params: [
                                new Parameter({
                                    id: new Declarator({ name: "index" })
                                }),
                                new Parameter({
                                    id: new Declarator({ name: "value" })
                                }),
                            ],
                            body: new BlockStatement({
                                body: [] // fields.map(field => createFieldGetterOrSetter(field, new Reference({ name: "value" }))).flat()
                            })
                        })
                    }),
                    //  BEGIN ITERATOR
                    new VariableDeclaration({
                        kind: "let",
                        id: new MemberExpression({
                            object: new Reference({ name: "Symbol" }),
                            property: new Identifier({ name: "iterator" }),
                        }),
                        value: new FunctionExpression({
                            generator: true,
                            params: [],
                            body: new BlockStatement({
                                body: [
                                    new VariableDeclaration({
                                        kind: "let",
                                        id: new Declarator({ name: "length" }),
                                        value: new MemberExpression({
                                            object: new ThisExpression({}),
                                            property: new Identifier({ name: "length" }),
                                        })
                                    }),
                                    new ForStatement({
                                        init: new VariableDeclaration({
                                            kind: "var",
                                            id: new Declarator({ name: "i" }),
                                            value: new Literal({ value: 0 })
                                        }),
                                        test: new BinaryExpression({
                                            left: new Reference({ name: "i" }),
                                            operator: "<",
                                            right: new Reference({ name: "length" }),
                                        }),
                                        update: new UnaryExpression({
                                            prefix: false,
                                            argument: new Reference({ name: "i" }),
                                            operator: "++"
                                        }),
                                        body: new BlockStatement({
                                            body: [
                                                new ExpressionStatement({
                                                    expression: new YieldExpression({
                                                        argument: new CallExpression({
                                                            callee: new MemberExpression({
                                                                object: new ThisExpression({}),
                                                                property: new Identifier({ name: "get" }),
                                                            }),
                                                            arguments: [new Reference({ name: "i" })],
                                                        })
                                                    })
                                                })
                                            ]
                                        })
                                    })
                                ]
                            })
                        })
                    }),
                ]
            }),
            static: []
        })
    })
}

export default function addTypedStructArrays(root: Assembly, options: Options) {
    console.log("SKIPPING TypedStructArrays for now")
    return root
    // let ancestors = new Map<Node,Node>()
    // let scopes = createScopeMaps(root, { ancestorsMap: ancestors })
    // return traverse(root, {
    //     enter(node) {
    //         if (TypeExpression.is(node)) {
    //             return skip
    //         }
    //     },
    //     leave(node) {
    //         if (ClassDeclaration.is(node) && node.isStruct && node.isData) {
    //             let [fields,naturalSize] = getFieldInfos(node, scopes, ancestors, 0)
    //             let actualFields = assignActualFields(fields)
    //             //  calculate stride for each actual field to move to the next element
    //             //  we have to pad each structure so that it ends at an even
    //             //  location to the largest contained type
    //             let largestTypeBytes = 0
    //             for (let field of actualFields) {
    //                 largestTypeBytes = Math.max(fieldTypes[field.type])
    //             }
    //             //  we pad the size if needed so it ends at an even unit same as largest type size
    //             let paddedSize = Math.ceil(naturalSize / largestTypeBytes) * largestTypeBytes
    //             for (let field of actualFields) {
    //                 field.stride = paddedSize / fieldTypes[field.type]
    //             }

    //             // calculate stride for each actual field
    //             // console.log("==========> ", JSON.stringify(fields, null, 2), actualFields)
    //             // console.log({ largestTypeBytes, naturalSize, paddedSize, actualFields })
    //             return node.patch({
    //                 static: [...node.static, createTypedArrayDeclaration(node, fields, actualFields, paddedSize, options)]
    //             })
    //         }
    //     }
    // })
}
