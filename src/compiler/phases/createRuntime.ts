import { Options } from "../Compiler";
import { traverse, skip, replace } from "@glas/traverse";
import Assembly from "../ast/Assembly";
import { ArrayExpression, AssignmentStatement, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, RegularExpression, ReturnStatement, ThisExpression, TypeExpression, VariableDeclaration, Range, ForOfStatement, UnaryExpression } from "../ast";
import { replaceNodes } from "./runtimeTypeChecking";
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
                        // if (DotExpression.is(node)) {
                        //     return new Reference({ name: "value" })
                        // }
                        if (BinaryExpression.is(node) && node.operator === "is") {
                            if (Reference.is(node.right) || RegularExpression.is(node.right) || MemberExpression.is(node.right)) {
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
                            let result = node
                            if (!node.isData) {
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
                                    result = result.patch({
                                        instance: new InstanceDeclarations({
                                            declarations: newInstances
                                        }),
                                        instanceType: null
                                    })
                                }
                            }
                            // remove extends from data classes
                            if (node.isData) {
                                result = result.patch({ baseClasses: [] })
                            }
                            //  handle static vars and typed vars
                            let staticVarsWithDefaults = node.static.filter(d => d.kind === "var" && d.value != null)
                            if (node.isData) {
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
                                usesIonscript = true
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
                            }
                            if (staticVarsWithDefaults.length > 0) {
                                result = replace(
                                    result,
                                    ...staticVarsWithDefaults.map(d => new AssignmentStatement({
                                        left: new MemberExpression({
                                            object: new Reference(node.id),
                                            property: new Identifier(d.id as Declarator)
                                        }),
                                        right: d.value!
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
