import { Options } from "../Compiler";
import { traverse, skip } from "@glas/traverse"
import { VariableDeclaration, Identifier, Assembly, ClassDeclaration, Reference, Declarator, FunctionExpression, BlockStatement, AssignmentPattern, ObjectPattern, ObjectExpression, Parameter, Property, ExpressionStatement, MemberExpression, ThisExpression, IfStatement, DotExpression, Statement, Type, TypeExpression, BinaryExpression, UnaryExpression, CallExpression, AssignmentExpression, Expression } from "../ast";
import { replaceNodes, throwTypeError } from "./runtimeTypeChecking";
import { clone, SemanticError } from "../common";
import combineExpressions from "../analysis/combineExpressions";
import * as types from "../types";
import toCodeString from "../toCodeString";

function toTypeCheck(type: Type, value: Reference) {
    if (Reference.is(type) || MemberExpression.is(type)) {
        return new BinaryExpression({
            left: value,
            operator: "is",
            right: type,
        })
    }
    return replaceNodes(type, DotExpression.is, value)
}

function createDataClassConstructor(node: ClassDeclaration, instanceVariables: VariableDeclaration[], isStruct: boolean, options: Options) {
    if (node.isStruct && instanceVariables.length === 0) {
        throw SemanticError("Structs must contain at least one property", node)
    }
    return new VariableDeclaration({
        kind: "let",
        instance: true,
        id: new Declarator({ location: node.id.location, name: "constructor" }),
        value: new FunctionExpression({
            returnType: new Reference(node.id),
            params: isStruct ?
                instanceVariables.map(v => {
                    return new Parameter({
                        id: clone(v.id),
                        value: clone(v.value),
                    })
                })
            : [
                new Parameter({
                    id: new AssignmentPattern({
                        left: new ObjectPattern({
                            properties: instanceVariables.map(v => {
                                return new Property({
                                    location: v.location,
                                    kind: "init",
                                    shorthand: true,
                                    key: clone(v.id) as Declarator,
                                    value: !v.value ? v.id : new AssignmentPattern({
                                        location: v.location,
                                        left: clone(v.id),
                                        right: clone(v.value)
                                    }),
                                })
                            })
                        }),
                        right: new ObjectExpression({ properties: [] })
                    }),
                    type: new TypeExpression({
                        value: combineExpressions(
                            [
                                new BinaryExpression({
                                    left: new DotExpression({}),
                                    operator: "is",
                                    right: types.Object,
                                }),
                                // Make these variable types optional...
                                ...instanceVariables.map(v => {
                                    let e = new BinaryExpression({
                                        left: new MemberExpression({
                                            object: new DotExpression({}),
                                            property: new Identifier(v.id as Declarator)
                                        }),
                                        operator: "is",
                                        right: v.type ?? types.Any,
                                    })
                                    // if this type is optional, then we add Undefined as an optional value
                                    let optional = v.type != null && toCodeString(v.type) !== toCodeString(types.Any) && v.value != null
                                    if (optional) {
                                        e = new BinaryExpression({
                                            left: e,
                                            operator: "||",
                                            right: new BinaryExpression({
                                                left: new MemberExpression({
                                                    object: new DotExpression({}),
                                                    property: new Identifier(v.id as Declarator)
                                                }),
                                                operator: "is",
                                                right: types.Undefined,
                                            })
                                        })
                                    }
                                    return e
                                })
                            ]
                        )
                    })
                })
            ],
            body: new BlockStatement({
                body: [
                    // first do type checks IF this is debug
                    ...(!options.debug ? [] : instanceVariables).map(v => {
                        return v.type == null ? null : new IfStatement({
                            test: new UnaryExpression({
                                prefix: true,
                                operator: "!",
                                argument: toTypeCheck(clone(v.type), new Reference(v.id as Declarator)),
                            }),
                            consequent: new BlockStatement({
                                body: [
                                    throwTypeError(v.type, (v.id as Declarator).name)
                                ]
                            })
                        })
                    }).filter(v => v != null) as Statement[],
                    ...instanceVariables.map(v => {
                        return new ExpressionStatement({
                            expression: new AssignmentExpression({
                                left: new MemberExpression({
                                    object: new ThisExpression({}),
                                    property: new Identifier(v.id as Declarator),
                                }),
                                right: new Reference(v.id as Declarator),
                            })
                        }) 
                    }),
                    ...(!options.debug ? [] : [
                        new ExpressionStatement({
                            expression: new CallExpression({
                                callee: new MemberExpression({
                                    object: new Reference({ location: node.id.location, name: "Object" }),
                                    property: new Identifier({ name: "freeze" }),
                                }),
                                arguments: [
                                    new ThisExpression({})
                                ]
                            })
                        })
                    ])
                ]
            })
        })
    })
}

function getConstructor(declarations: ReadonlyArray<VariableDeclaration>) {
    return declarations.find(d => Identifier.is(d.id) && d.id.name === "constructor")
}

function convertInterfaceToType(node: ClassDeclaration, options: Options) {
    // convert this interface to a runtime type declaration
    let { location } = node
    let expressions: Expression[] = []
    for (let ref of node.baseClasses) {
        expressions.push(new BinaryExpression({
            left: new DotExpression({ location }),
            operator: "is",
            right: ref,
        }))
    }
    for (let ref of node.interfaces) {
        options.errors.push(SemanticError(`Use 'extends' instead of 'implements' in interfaces`, ref))
    }
    for (let staticMember of node.static) {
        options.errors.push(SemanticError(`Static members not allowed in interfaces`, staticMember.static))
    }
    for (let d of node.instance.declarations) {
        if (!VariableDeclaration.is(d)) {
            options.errors.push(SemanticError(`Declaration type not allowed in interfaces`, d))
        }
        else {
            if (d.value != null) {
                options.errors.push(SemanticError(`Default values not allowed on interface members`, d.value))
            }
            if (d.type == null) {
                options.errors.push(SemanticError(`Interface members must specify a type`, d.id))
            }
            else {
                expressions.push(new BinaryExpression({
                    left: new MemberExpression({
                        object: new DotExpression({ location }),
                        property: d.id
                    }),
                    operator: "is",
                    right: d.type,
                }))
            }
        }
    }
    return new VariableDeclaration({
        location,
        kind: "type",
        id: node.id,
        value: expressions.length == 0
        ? types.Any
        : new TypeExpression({
            location,
            value: combineExpressions(expressions, "&&")
        }),
    })
}

export default function addDataClassConstructors(root: Assembly, options: Options) {

    return traverse(root, {
        enter(node) {
            if (ClassDeclaration.is(node) || TypeExpression.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (ClassDeclaration.is(node)) {
                if ((node.isData && node.isStruct && getConstructor(node.instance.declarations) == null)) {
                    return node.patch({
                        instance: node.instance.patch({
                            declarations: [
                                createDataClassConstructor(node, [...node.instance.declarations.values()].filter(a => a.kind === "var"), node.isStruct, options),
                                ...node.instance.declarations,
                            ]
                        })
                    })
                }
                if (node.isInterface) {
                    return convertInterfaceToType(node, options)
                }
            }
        }
    })

}