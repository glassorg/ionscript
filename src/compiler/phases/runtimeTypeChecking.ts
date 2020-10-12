import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import Assembly from "../ast/Assembly"
import { AssignmentStatement, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, IfStatement, ImportDeclaration, ImportNamespaceSpecifier, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, ReturnStatement, Statement, ThisExpression, ThrowStatement, Type, TypeExpression, UnaryExpression, VariableDeclaration } from "../ast"
import { getLast } from "../common"

// let Vector_x = Symbol("Vector_x")
function getSymbolName(c: ClassDeclaration, d: VariableDeclaration) {
    return `${c.id.name}_${(d.id as Identifier).name}`
}

function typeCheckOrThrow(value: Expression, type: Type, name: string): Statement {
    return new IfStatement({
        test: new UnaryExpression({
            operator: "!",
            argument: new BinaryExpression({ left: value, operator: "is", right: type })
        }),
        consequent: new BlockStatement({
            body: [
                new ThrowStatement({
                    argument: new CallExpression({
                        new: true,
                        callee: new Reference({ name: "Error" }),
                        arguments: name ? [new Literal({ value: `Invalid value for ${name}`})] : []
                    })
                })
            ]
        })
    })
}

export function replaceNodes(root, match: (a) => boolean, replacement) {
    return traverse(
        root, {
            leave(node) {
                if (match(node)) {
                    return replacement
                }
            }
        }
    )
}

function replaceTypedVarsWithProperties(clas: ClassDeclaration, options: Options) {
    return traverse(clas, {
        enter(node) {
            if (!ClassDeclaration.is(node) && Declaration.is(node)) {
                return skip
            }
        },
        leave(node, ancestors) {
            if (VariableDeclaration.is(node)) {
                if (node.static || node.instance) {
                    if (node.kind === "var" && node.type != null) {
                        let classDeclaration = getLast(ancestors, ClassDeclaration.is)!
                        let name = getSymbolName(classDeclaration, node)
                        // can convert to get/set with types here, BUT that would mean suckitude.
                        // convert to type and shit
                        return replace(
                            new VariableDeclaration({
                                static: node.static,
                                kind: "get",
                                id: node.id,
                                value: new FunctionExpression({
                                    params: [],
                                    body: new BlockStatement({
                                        body: [
                                            new ReturnStatement({
                                                argument: new MemberExpression({
                                                    object: new ThisExpression({}),
                                                    property: new Reference({ name })
                                                })
                                            })
                                        ]
                                    })
                                })
                            }),
                            new VariableDeclaration({
                                static: node.static,
                                kind: "set",
                                id: node.id,
                                value: new FunctionExpression({
                                    params: [new Parameter({ id: new Declarator({ name: "value" }) })],
                                    body: new BlockStatement({
                                        body: [
                                            typeCheckOrThrow(new Reference({ name: "value" }), node.type, name.replace('_', ' ')),
                                            new AssignmentStatement({
                                                left: new MemberExpression({
                                                    object: new ThisExpression({}),
                                                    property: new Reference({ name })
                                                }),
                                                right: new Reference({ name: "value" }),
                                            })
                                        ]
                                    })
                                })
                            })
                        )
                    }
                }
            }            
        }
    })
}

// also adds ion import if there are any references to ion
export default function runtimeTypeChecking(root: Assembly, options: Options) {
    if (!options.debug) {
        // skip all automatic runtime type checks if this is a release build
        return root
    }
    return traverse(root, {
        enter(node) {
            if (Program.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (Program.is(node)) {
                let hasIonReference = false
                let result = traverse(node, {
                    enter(node) {
                        if (Reference.is(node) && node.name === "ion") {
                            hasIonReference = true
                        }
                    },
                    leave(node, ancestors, path) {
                        if (VariableDeclaration.is(node)) {
                            if (node.kind === "type") {
                                return node.patch({
                                    kind: "const",
                                    value: Reference.is(node.value)
                                        ? node.value
                                        : new CallExpression({
                                            new: true,
                                            callee: new MemberExpression({
                                                object: new Reference({ name: "ion" }),
                                                property: new Identifier({ name: "Type" })
                                            }),
                                            arguments: [
                                                new Literal({ value: (node.id as Identifier).name }),
                                                new FunctionExpression({
                                                    params: [
                                                        new Parameter({ id: new Declarator({ name: "_" }) })
                                                    ],
                                                    body: new BlockStatement({
                                                        body: [ new ReturnStatement({ argument: replaceNodes((node as any).value.value ?? node.value, DotExpression.is, new Reference({ name: "_" })) }) ]
                                                    })
                                                })
                                            ]
                                        })
                                })
                            }
                        }
            
                        if (FunctionExpression.is(node)) {
                            //  only works without destructuring for now
                            let typedParams = node.params.filter(p => p.type != null && Identifier.is(p.id))
                            if (typedParams != null) {
                                return node.patch({
                                    body: node.body.patch({
                                        body: [
                                            ...typedParams.map(p => typeCheckOrThrow(new Reference(p.id as Identifier), p.type!, (p.id as Identifier).name)),
                                            ...node.body.body
                                        ]
                                    })
                                })
                            }
                        }
                        if (ClassDeclaration.is(node) && !node.isData) {
                            // first find any typed vars we need to create symbols for
                            //  handle typed variables by adding symbols to use for storing values
                            let typedVars = [...node.static, ...node.instance.declarations].filter(d => d.type != null)
                            if (typedVars.length > 0) {
                                return replace(
                                    ...typedVars.map(d => {
                                        let name = getSymbolName(node, d)
                                        return new VariableDeclaration({
                                            kind: "let",
                                            id: new Declarator({ name }),
                                            value: new CallExpression({
                                                callee: new Reference({ name: "Symbol" }),
                                                arguments: options.debug
                                                    ? [new Literal({ value: name })]
                                                    : []
                                            })
                                        })
                                    }),
                                    replaceTypedVarsWithProperties(node, options),
                                )
                            }
                        }
                    }
                })
                if (hasIonReference) {
                    result = result.patch({
                        body: [
                            new ImportDeclaration({
                                specifiers: [
                                    new ImportNamespaceSpecifier({
                                        local: new Declarator({ name: "ion" })
                                    })
                                ],
                                source: new Literal({ value: "ion" }),
                            }),
                            ...result.body
                        ]
                    })
                }
                return result
            }
        }
    })
}
