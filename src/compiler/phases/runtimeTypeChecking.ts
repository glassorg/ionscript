import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import Assembly from "../ast/Assembly"
import { AssignmentExpression, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, FunctionType, Identifier, IfStatement, ImportDeclaration, ImportNamespaceSpecifier, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, RegularExpression, ReturnStatement, RuntimeType, Statement, ThisExpression, ThrowStatement, Type, TypeExpression, UnaryExpression, VariableDeclaration } from "../ast"
import { getLast, runtimeModuleName } from "../common"
import toCodeString from "../toCodeString"
import combineExpressions from "../analysis/combineExpressions"

// let Vector_x = Symbol("Vector_x")
function getSymbolName(c: ClassDeclaration, d: VariableDeclaration) {
    return `${c.id.name}_${(d.id as Reference).name}`
}

export function throwTypeError(type: Type, valueName: string): Statement {
    let typeName = Reference.is(type) ? type.name : "Valid"
    let stringValue = combineExpressions([
        new Literal({ value: `${valueName} is not ${typeName}: ` }),
        new Reference({ name: valueName })
    ], "+")
    return new ThrowStatement({
        argument: new CallExpression({
            new: true,
            callee: new Reference({ name: "Error" }),
            arguments: [stringValue]
        })
    })
}

export function typeCheckOrThrow(value: Expression, type: Type, name: string): Statement {
    return new IfStatement({
        test: new UnaryExpression({
            operator: "!",
            argument: new BinaryExpression({ left: value, operator: "is", right: type })
        }),
        consequent: new BlockStatement({
            body: [
                throwTypeError(type, name)
            ]
        })
    })
}

/**
 * Replaces nodes but returns original if none were replaced.
 */
export function replaceNodes(root, match: (a) => boolean, replacement) {
    let replaceCount = 0
    let result = traverse(
        root, {
            leave(node) {
                if (match(node)) {
                    replaceCount++
                    return replacement
                }
            }
        }
    )
    return replaceCount > 0 ? result : root
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
                            // EITHER provide default here OR retain property for later createRuntime usage initializing in constructor and then remove.
                            node.patch({ inherited: true }), // we flag inherited so it can be removed 
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
                                            typeCheckOrThrow(new Reference({ name: "value" }), node.type, "value"),
                                            new ExpressionStatement({
                                                expression: new AssignmentExpression({
                                                    left: new MemberExpression({
                                                        object: new ThisExpression({}),
                                                        property: new Reference({ name })
                                                    }),
                                                    right: new Reference({ name: "value" }),
                                                })
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

export function toRuntimeType(type, name: string) {

    if (FunctionType.is(type)) {
        //  we do NOT have runtime function type checking yet
        //  so we at least just verify that it is in fact a function.
        return new Reference({ name: "Function" })
    }

    if (RuntimeType.is(type)) {
        return type
    }

    return new CallExpression({
        new: true,
        callee: new MemberExpression({
            object: new Reference({ name: runtimeModuleName }),
            property: new Identifier({ name: "Type" })
        }),
        arguments: [
            FunctionExpression.is(type)
            ? type
            : new FunctionExpression({
                params: [
                    new Parameter({ id: new Declarator({ name: "_" }) })
                ],
                body: new BlockStatement({
                    body: [
                        new ReturnStatement({
                            argument: traverse((type as TypeExpression).value ?? type, {
                                leave(node) {
                                    if (DotExpression.is(node)) {
                                        return new Reference({ name: "_" })
                                    }
                                    // type checks should NOT throw null so we implicitly convert all dot expressions to optional
                                    if (MemberExpression.is(node) && !node.optional) {
                                        return node.patch({ optional: true })
                                    }
                                }
                            })
                        })
                    ]
                })
            }),
            new Literal({ value: name }),
        ]
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
                // let hasIonReference = false
                let result = traverse(node, {
                    enter(node) {
                        // if (Reference.is(node) && node.name === runtimeModuleName) {
                        //     hasIonReference = true
                        // }
                        if (TypeExpression.is(node)) {
                            return skip
                        }
                    },
                    leave(node, ancestors, path) {
                        if (VariableDeclaration.is(node)) {
                            if (node.kind === "type") {
                                return node.patch({
                                    kind: "const",
                                    value: toRuntimeType(node.value, (node.id as Declarator).name)
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
                                            ...typedParams.map(p => typeCheckOrThrow(new Reference(p.id as Reference), p.type!, (p.id as Reference).name)),
                                            ...node.body.body,
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
                // if (hasIonReference) {
                //     result = result.patch({
                //         body: [
                //             new ImportDeclaration({
                //                 specifiers: [
                //                     new ImportNamespaceSpecifier({
                //                         local: new Declarator({ name: runtimeModuleName })
                //                     })
                //                 ],
                //                 source: new Literal({ value: runtimeModuleName }),
                //             }),
                //             ...result.body
                //         ]
                //     })
                // }
                return result
            }
        }
    })
}
