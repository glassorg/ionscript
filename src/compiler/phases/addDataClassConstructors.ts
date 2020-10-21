import { Options } from "../Compiler";
import { traverse, skip } from "@glas/traverse"
import { VariableDeclaration, Identifier, Literal, Assembly, ClassDeclaration, Declaration, Reference, Node, Declarator, FunctionExpression, BlockStatement, AssignmentPattern, ObjectPattern, ObjectExpression, Parameter, Property, ExpressionStatement, AssignmentStatement, MemberExpression, ThisExpression, IfStatement, DotExpression, Statement, Expression, Type, TypeExpression, BinaryExpression, UnaryExpression, ThrowStatement, CallExpression } from "../ast";
import { replaceNodes } from "./runtimeTypeChecking";

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

function createDataClassConstructor(instanceVariables: VariableDeclaration[], isStruct: boolean, options: Options) {
    return new VariableDeclaration({
        kind: "let",
        id: new Declarator({ name: "constructor" }),
        value: new FunctionExpression({
            params: isStruct ?
                instanceVariables.map(v => {
                    return new Parameter({
                        id: v.id,
                        value: v.value
                    })
                })
            : [
                new Parameter({
                    id: new AssignmentPattern({
                        left: new ObjectPattern({
                            properties: instanceVariables.map(v => {
                                return new Property({
                                    kind: "init",
                                    shorthand: true,
                                    key: v.id as Declarator,
                                    value: !v.value ? v.id : new AssignmentPattern({
                                        left: v.id,
                                        right: v.value
                                    }),
                                })
                            })
                        }),
                        right: new ObjectExpression({ properties: [] })
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
                                argument: toTypeCheck(v.type, new Reference(v.id as Declarator)),
                            }),
                            consequent: new BlockStatement({
                                body: [
                                    new ThrowStatement({
                                        argument: new CallExpression({
                                            callee: new Reference({ name: "Error" }),
                                            arguments: [
                                                new Literal({ value: `Invalid value for ${(v.id as Declarator).name}`})
                                            ]
                                        })
                                    })
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
                                    object: new Reference({ name: "Object" }),
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

export default function addDataClassConstructors(root: Assembly, options: Options) {

    return traverse(root, {
        enter(node) {
            if (ClassDeclaration.is(node) || TypeExpression.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (ClassDeclaration.is(node) && node.isData) {
                return node.patch({
                    instance: node.instance.patch({
                        declarations: [
                            createDataClassConstructor([...node.instance.declarations.values()].filter(a => a.kind === "var"), node.isStruct, options),
                            ...node.instance.declarations,
                        ]
                    })
                })
            }
        }
    })

}