import { Options } from "../Compiler";
import { traverse, skip, replace } from "@glas/traverse";
import Assembly from "../ast/Assembly";
import { AssignmentStatement, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Property, Reference, ReturnStatement, ThisExpression, TypeExpression, VariableDeclaration } from "../ast";
import { replaceNodes } from "./runtimeTypeChecking";

export default function createRuntime(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            if (VariableDeclaration.is(node) && node.kind === "type") {
                return skip
            }
        },
        leave(node, ancestors, path) {
            //  types here.
            if (TypeExpression.is(node)) {
                return node.value
            }
            if (DotExpression.is(node)) {
                return new Reference({ name: "value" })
            }
            if (BinaryExpression.is(node) && node.operator === "is") {
                if (Reference.is(node.right)) {
                    return new CallExpression({
                        callee: new MemberExpression({
                            object: new Reference({ name: "ion" }),
                            property: new Identifier({ name: "is" })
                        }),
                        arguments: [ node.left, node.right ],
                    })
                }
                else {
                    return replaceNodes(node.right, DotExpression.is, node.left)
                }
            }

            //  checked variables and things.
            if (VariableDeclaration.is(node)) {
                if (node.static || node.instance) {
                    if (node.kind === "let" && node.value != null && !FunctionExpression.is(node.value)) {
                        return node.patch({
                            kind: "get",
                            value: new FunctionExpression({
                                params: [],
                                body: new BlockStatement({
                                    body: [
                                        new ReturnStatement({ argument: node.value })
                                    ]
                                })
                            })
                        })
                    }
                }
            }
            if (ClassDeclaration.is(node)) {
                //  iterate and find var variables with a default value
                let instanceVarsWithDefaults = node.instance.declarations.filter(d => d.kind === "var" && d.value != null)
                if (instanceVarsWithDefaults.length > 0) {
                    let ctor = node.instance.declarations.find(d => (d.id as Declarator).name === "constructor")
                        ?? new VariableDeclaration({
                            kind: "let",
                            id: new Declarator({ name: "constructor" }),
                            value: new FunctionExpression({
                                params: [],
                                body: new BlockStatement({
                                    body: []
                                })
                            })
                        })
                    let newCtor = ctor.patch({
                        value: (ctor.value as FunctionExpression).patch({
                            body: new BlockStatement({
                                body: [
                                    ...instanceVarsWithDefaults.map(d => new AssignmentStatement({
                                        left: new MemberExpression({
                                            object: new ThisExpression({}),
                                            property: new Identifier(d.id as Declarator)
                                        }),
                                        right: d.value!
                                    })),
                                    ...(ctor.value as FunctionExpression).body.body
                                ]
                            })
                        })
                    })
                    let newInstances = node.instance.declarations.map(d => d === ctor ? newCtor : d)
                    if (newInstances.length === node.instance.declarations.length) {
                        newInstances = [newCtor, ...newInstances]
                    }
                    let result = node.patch({
                        instance: new InstanceDeclarations({
                            declarations: newInstances
                        })
                    })
                    //  handle static vars and typed vars
                    let staticVarsWithDefaults = node.static.filter(d => d.kind === "var" && d.value != null)
                    if (staticVarsWithDefaults.length > 0) {
                        result = replace(
                            result,
                            ...staticVarsWithDefaults.map(d => new AssignmentStatement({
                                left: new MemberExpression({
                                    object: new Reference(result.id),
                                    property: new Identifier(d.id as Declarator)
                                }),
                                right: d.value!
                            })),
                        )
                    }
                    return result
                }
            }
        }
    })
}
