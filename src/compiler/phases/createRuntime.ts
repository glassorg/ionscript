import { Options } from "../Compiler";
import { traverse, skip, replace } from "@glas/traverse";
import Assembly from "../ast/Assembly";
import { ArrayExpression, AssignmentExpression, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, RegularExpression, ReturnStatement, ThisExpression, TypeExpression, VariableDeclaration, Range, ForOfStatement, UnaryExpression, SpreadElement, FunctionType, RuntimeType, EnumDeclaration } from "../ast";
import { replaceNodes, toRuntimeType } from "./runtimeTypeChecking";
import { typeProperties } from "./inferTypes";
import { hasDeclarator, runtimeModuleName } from "../common";
import createTypeCheck from "../../createTypeCheck";

export default function createRuntime(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Program.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (Program.is(node)) {
                let usesIonscript = false
                node = traverse(node, {
                    enter(node) {
                        if (VariableDeclaration.is(node) && node.kind === "type") {
                            return skip
                        }
                        // cannot skip TypeExprssions as we need to convert 'is' operators within them to is calls.
                        // if (TypeExpression.is(node)) {
                        //     return skip
                        // }
                    },
                    leave(node, ancestors, path) {
                        if (EnumDeclaration.is(node)) {
                            usesIonscript = true
                            // we will convert this to something else.
                            let { location } = node
                            return new VariableDeclaration({
                                location,
                                export: node.export,
                                kind: "let",
                                id: new Declarator(node.id),
                                value: new CallExpression({
                                    location,
                                    new: true,
                                    callee: new MemberExpression({
                                        location,
                                        object: new Reference({ location, name: runtimeModuleName }),
                                        property: new Identifier({ location, name: "Enum" }),
                                    }),
                                    arguments: [
                                        new Literal({ location, value: node.id.name }),
                                        new ObjectExpression({ properties: node.properties })
                                    ]
                                })
                            })
                        }
                        //  types here.
                        if (Reference.is(node)) {
                            if (node.name === runtimeModuleName) {
                                usesIonscript = true
                            }
                        }
                        // add external count if needed to for arrays
                        if (ForOfStatement.is(node) && node.count != null) {
                            let { location } = node
                            return new BlockStatement({
                                location,
                                body: [
                                    new VariableDeclaration({ ...node.count, kind: "var", value: new Literal({ location, value: 0 }) }),
                                    node.patch({
                                        count: null,
                                        body: node.body.patch({
                                            body: [
                                                ...node.body.body,
                                                new ExpressionStatement({
                                                    location,
                                                    expression: new UnaryExpression({
                                                        location,
                                                        operator: "++",
                                                        argument: new Reference({
                                                            location: node.count.location,
                                                            name: (node.count.id as Declarator).name,
                                                        })
                                                    })
                                                })
                                            ]
                                        })
                                    }),
                                ]
                            })
                        }
                        if (Range.is(node)) {
                            // replace with call to ionscript.range(start, end, inclusive, step)
                            usesIonscript = true
                            let { location } = node
                            let args = [node.start, node.end]
                            if (node.inclusive) {
                                args.push(new Literal({ location, value: true }))
                            }
                            if (node.step) {
                                args.push(node.step)
                            }
                            return new CallExpression({
                                location,
                                callee: new MemberExpression({
                                    location,
                                    object: new Reference({ location, name: runtimeModuleName }),
                                    property: new Identifier({ location, name: "range" }),
                                }),
                                arguments: args,
                            })
                        }
                        if (TypeExpression.is(node)) {
                            let last = path[path.length - 1]
                            if (typeProperties.has(last)) {
                                return null
                            }
                            return node.value
                        }
                        if (FunctionType.is(node)) {
                            //  we do NOT have runtime function type checking yet
                            //  so we at least just verify that it is in fact a function.
                            return new Reference({ name: "Function" })
                        }
                        if (BinaryExpression.is(node) && node.operator === "is") {
                            if (RuntimeType.is(node.right)) {
                                usesIonscript = true
                                return new CallExpression({
                                    callee: new MemberExpression({
                                        object: new Reference({ name: runtimeModuleName }),
                                        property: new Identifier({ name: "is" }),
                                    }),
                                    arguments: [ node.left, node.right ],
                                })
                            }
                            else {
                                return replaceNodes(node.right, DotExpression.is, node.left)
                            }
                        }
                        //  checked variables and things.
                        //  we NO longer convert let statements to get functions.
                        // if (VariableDeclaration.is(node)) {
                        //     if (node.static || node.instance) {
                        //         // for now.... TODO: Fix, convert let to var
                        //         // if (node.kind === "let" && node.value != null && !FunctionExpression.is(node.value)) {
                        //         //     return node.patch({
                        //         //         kind: "get",
                        //         //         value: new FunctionExpression({
                        //         //             params: [],
                        //         //             body: new BlockStatement({
                        //         //                 body: [
                        //         //                     new ReturnStatement({ argument: node.value })
                        //         //                 ]
                        //         //             })
                        //         //         })
                        //         //     })
                        //         // }
                        //     }
                        // }
                        if (ClassDeclaration.is(node)) {
                            let result = node
                            if (!node.isData) {
                                //  iterate and find var variables with a default value
                                let instanceVarsWithDefaults = node.instance.declarations.filter(d => d.kind === "var" && d.value != null && Identifier.is(d.id))
                                if (instanceVarsWithDefaults.length > 0) {
                                    let ctor = node.instance.declarations.find(d => (d.id as Declarator).name === "constructor")
                                    let newCtor = ctor
                                        ?? new VariableDeclaration({
                                            kind: "let",
                                            id: new Declarator({ name: "constructor" }),
                                            value: new FunctionExpression({
                                                params: [],
                                                body: new BlockStatement({
                                                    body: node.baseClasses.length
                                                        ? [
                                                            new ExpressionStatement({
                                                                expression: new CallExpression({
                                                                    callee: new Reference({ name: "super"}),
                                                                    arguments: []
                                                                })
                                                            })
                                                        ]
                                                        : []
                                                })
                                            })
                                        })
                                    let newCtorBody = [
                                        ...instanceVarsWithDefaults.map(d => new ExpressionStatement({
                                            expression: new AssignmentExpression({
                                                left: new MemberExpression({
                                                    object: new ThisExpression({}),
                                                    property: new Identifier(d.id as Declarator)
                                                }),
                                                right: d.value!
                                            })
                                        })),
                                        ...(newCtor.value as FunctionExpression).body.body
                                    ]
                                    // move any super call back to the top.
                                    {
                                        let isSuper = node => node?.expression?.callee?.name === "super"
                                        let supers = newCtorBody.filter(isSuper)
                                        let nonSupers = newCtorBody.filter(n => !isSuper(n))
                                        newCtorBody = [...supers, ...nonSupers]
                                    }

                                    newCtor = newCtor.patch({
                                        value: (newCtor.value as FunctionExpression).patch({
                                            body: new BlockStatement({
                                                body: newCtorBody
                                            })
                                        })
                                    })
                                    let newInstances = [newCtor, ...node.instance.declarations.filter(d => d !== ctor)]
                                    result = result.patch({
                                        instance: new InstanceDeclarations({
                                            declarations: newInstances
                                        }),
                                        instanceType: null
                                    })
                                }
                            }
                            // remove extends from data classes and insert single extends from ionscript.Data
                            if (node.isData) {
                                result = result.patch({
                                    baseClasses:
                                        node.isStruct
                                        ? []
                                        : [
                                            new MemberExpression({
                                                object: new Reference({ name: runtimeModuleName }),
                                                property: new Identifier({ name: "Data" })
                                            })
                                        ],
                                    // also remove all the instance variable declarations
                                    // instance: result.instance!.patch({
                                    //     declarations: []
                                    // })
                                })
                            }
                            //  handle static vars and typed vars
                            let staticVarsWithDefaults = node.static.filter(d => (d.kind === "var" || d.kind === "let") && d.value != null)
                            if (node.isData) {
                                usesIonscript = true
                                staticVarsWithDefaults.push(
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        id: new Declarator({ name: "baseClasses" }),
                                        value: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: "Set"}),
                                            arguments: [
                                                new ArrayExpression({
                                                    elements: node.baseClasses
                                                })
                                            ]
                                        })
                                    })
                                )
                                staticVarsWithDefaults.push(
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        id: new Declarator({ name: "is" }),
                                        value: new CallExpression({
                                            callee: new MemberExpression({
                                                object: new Reference({ name: runtimeModuleName }),
                                                property: new Identifier({ name: createTypeCheck.name.valueOf() }),
                                            }),
                                            arguments: [ new Reference(node.id) ],
                                        })
                                    })
                                )
                                // insert (ClassName).prototype.properties
                                const instancePropertiesLocation = "prototype.properties"
                                staticVarsWithDefaults.push(
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        //  this prototype.properties hack works fine in generated javascript
                                        //  could also do "prototype[ionscript.symbols.properties]"
                                        id: new Declarator({ name: instancePropertiesLocation }),
                                        value: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: "Map" }),
                                            arguments: [
                                                new ArrayExpression({
                                                    elements: [
                                                        ...node.baseClasses.map(
                                                            base => new SpreadElement({
                                                                argument: new MemberExpression({
                                                                    object: base,
                                                                    property: new Identifier({ name: instancePropertiesLocation })
                                                                })
                                                            })
                                                        ) as any,
                                                        ...node.instance.declarations.filter(d => !d.inherited && d.instance && Identifier.is(d.id) && d.id.name !== "constructor").map(
                                                            d => {
                                                                let name = (d.id as Declarator).name
                                                                return new ArrayExpression({
                                                                    elements: [
                                                                        new Literal({ value: name }),
                                                                        new CallExpression({
                                                                            new: true,
                                                                            callee: new MemberExpression({
                                                                                object: new Reference({ name: runtimeModuleName }),
                                                                                property: new Identifier({ name: "Property" })
                                                                            }),
                                                                            arguments: [
                                                                                new ObjectExpression({
                                                                                    properties: (() => {
                                                                                        let writable = d.kind === "var"
                                                                                        let properties = new Array<Property>()
                                                                                        // writable
                                                                                        if (writable) {
                                                                                            properties.push(
                                                                                                new Property({
                                                                                                    key: new Identifier({ name: "writable" }),
                                                                                                    value: new Literal({ value: writable }),
                                                                                                }),
                                                                                                // we also make any writable properties enumerable as well
                                                                                                new Property({
                                                                                                    key: new Identifier({ name: "enumerable" }),
                                                                                                    value: new Literal({ value: writable }),
                                                                                                }),
                                                                                            )
                                                                                        }
                                                                                        if (d.type) {
                                                                                            properties.push(
                                                                                                new Property({
                                                                                                    key: new Identifier({ name: "type" }),
                                                                                                    value: toRuntimeType(d.type, `${node.id.name}.${name}.Type`),
                                                                                                })
                                                                                            )
                                                                                        }
                                                                                        if (d.value) {
                                                                                            if (d.kind === "get") {
                                                                                                properties.push(
                                                                                                    new Property({
                                                                                                        key: new Identifier({ name: "get" }),
                                                                                                        method: true,
                                                                                                        value: d.value!,
                                                                                                    })
                                                                                                )
                                                                                            }
                                                                                            else {
                                                                                                properties.push(
                                                                                                    new Property({
                                                                                                        key: new Identifier({ name: "value" }),
                                                                                                        method: FunctionExpression.is(d.value),
                                                                                                        value: d.value,
                                                                                                    })
                                                                                                )
                                                                                            }
                                                                                        }
                                                                                        return properties
                                                                                    })() as any
                                                                                })
                                                                            ]
                                                                        })
                                                                        // need a new Property implementation.
                                                                    ]
                                                                })
                                                            }
                                                        )
                                                    ]
                                                })
                                            ],
                                        })
                                    })
                                )
                            }
                            if (staticVarsWithDefaults.length > 0) {
                                result = replace(
                                    result,
                                    ...staticVarsWithDefaults.map(d => new ExpressionStatement({
                                        expression: new AssignmentExpression({
                                            left: new MemberExpression({
                                                object: new Reference(node.id),
                                                property: new Identifier(d.id as Declarator)
                                            }),
                                            right: d.value!
                                        })
                                    })),
                                )
                            }
                            return result
                        }
                    }
                })
                // insert an import of ionscript
                if (usesIonscript && !hasDeclarator(node.body, runtimeModuleName)) {
                    node = node.patch({
                        body: [
                            new ImportDeclaration({
                                specifiers: [
                                    new ImportNamespaceSpecifier({
                                        local: new Declarator({ name: runtimeModuleName })
                                    })
                                ],
                                source: new Literal({ value: runtimeModuleName })
                            }),
                            ...node.body
                        ]
                    })
                }
                return node
            }
        }
    })
}
