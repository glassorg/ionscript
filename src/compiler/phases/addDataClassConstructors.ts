import { Options } from "../Compiler";
import { traverse, skip } from "@glas/traverse"
import { VariableDeclaration, Identifier, Literal, Assembly, ClassDeclaration, Declaration, Reference, Node, Declarator, FunctionExpression, BlockStatement, AssignmentPattern, ObjectPattern, ObjectExpression, Parameter, Property, ExpressionStatement, AssignmentStatement, MemberExpression, ThisExpression, IfStatement, DotExpression, Statement, Expression, Type, TypeExpression, BinaryExpression, UnaryExpression, ThrowStatement, CallExpression } from "../ast";
import { replaceNodes, throwTypeError } from "./runtimeTypeChecking";
import { clone } from "../common";
import combineExpressions from "../analysis/combineExpressions";
import * as types from "../types";
import toCodeString from "../toCodeString";

function toTypeCheck(type: Type, value: Reference) {
    if (Reference.is(type)) {
        return new BinaryExpression({
            left: value,
            operator: "is",
            right: type,
        })
    }
    return replaceNodes(type, DotExpression.is, value)
}

function createDataClassConstructor(node: ClassDeclaration, instanceVariables: VariableDeclaration[], isStruct: boolean, options: Options) {
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
                        return new AssignmentStatement({
                            left: new MemberExpression({
                                object: new ThisExpression({}),
                                property: new Identifier(v.id as Declarator),
                            }),
                            right: new Reference(v.id as Declarator),
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

export default function addDataClassConstructors(root: Assembly, options: Options) {

    return traverse(root, {
        enter(node) {
            if (ClassDeclaration.is(node) || TypeExpression.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (ClassDeclaration.is(node) && (node.isData || node.isStruct && getConstructor(node.instance.declarations) == null)) {
                return node.patch({
                    instance: node.instance.patch({
                        declarations: [
                            createDataClassConstructor(node, [...node.instance.declarations.values()].filter(a => a.kind === "var"), node.isStruct, options),
                            ...node.instance.declarations,
                        ]
                    })
                })
            }
        }
    })

}