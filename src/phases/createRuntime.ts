import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import Assembly from "../ast/Assembly"
import { AssignmentStatement, BlockStatement, CallExpression, ClassDeclaration, Declarator, DotExpression, ExpressionStatement, FunctionExpression, Identifier, InstanceDeclarations, MemberExpression, ObjectExpression, Property, Reference, ReturnStatement, ThisExpression, TypeExpression, VariableDeclaration } from "../ast"
import { getLast } from "../common"

export default function createRuntime(root: Assembly, options: Options) {
    return traverse(root, {
        leave(node, ancestors, path) {
            //  types here.
            if (TypeExpression.is(node)) {
                return node.value
            }
            if (DotExpression.is(node)) {
                return new Reference({ name: "value" })
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
