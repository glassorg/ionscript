import { Options } from "../Compiler"
import { traverse, skip, remove } from "@glas/traverse"
import { ArrayExpression, BlockStatement, CallExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, ReturnStatement, SpreadElement, Statement } from "../ast"
import Assembly from "../ast/Assembly"
import { SemanticError } from "../common"
import ArrowFunctionExpression from "../ast/ArrowFunctionExpression"
import PropertyStatement from "../ast/PropertyStatement"
import AssignmentStatement from "../ast/AssignmentStatement"

export default function controlFlowToExpressions(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
        },
        leave(node) {
            if (ObjectExpression.is(node) && node.properties.find(Statement.is)) {
                let name = "$"
                let ref = new Reference({ name })
                let id = new Identifier({ name })
                return new CallExpression({
                    callee: new ArrowFunctionExpression({
                        params: [ new Parameter({ id }) ],
                        expression: false,
                        body: new BlockStatement({
                            body: traverse(node.properties, {
                                enter(e) {
                                    //  don't traverse into call expressions
                                    //  also don't recurse into expressions or expression statements
                                    //  basically we only want to recurse into control flow statements
                                    if (CallExpression.is(e) || Expression.is(e) || ExpressionStatement.is(e)) {
                                        return skip
                                    }
                                },
                                leave(e, ancestors, path) {
                                    //  if this is an immediate child expression we treat it as a statement
                                    //  so it gets converted to an ExpressionStatement down below.
                                    let parent = ancestors[ancestors.length - 1]
                                    if (PropertyStatement.is(e)) {
                                        e = e.property
                                    }
                                    if (Property.is(e) && Array.isArray(parent)) {
                                        return new AssignmentStatement({
                                            left: new MemberExpression({
                                                object: ref,
                                                property: e.key,
                                            }),
                                            operator: "=",
                                            right: e.value as Expression,
                                        })
                                    }
                                }
                            }).concat([ new ReturnStatement({ argument: ref })])
                        })
                    }),
                    arguments: [ new ObjectExpression({ properties: [] }) ]
                })
                return new ObjectExpression({
                    properties: traverse(node.properties, {
                        enter(e) {
                            //  don't traverse into call expressions
                            //  also don't recurse into expressions or expression statements
                            //  basically we only want to recurse into control flow statements
                            if (CallExpression.is(e) || Expression.is(e) || ExpressionStatement.is(e)) {
                                return skip
                            }
                        },
                        leave(e, ancestors, path) {
                            if (PropertyStatement.is(e)) {
                                return e.property
                            }
                        }
                    })
                })
            }
            if (ArrayExpression.is(node) && node.elements.find(Statement.is)) {
                let name = "$"
                let ref = new Reference({ name })
                let id = new Identifier({ name })
                let push = new Identifier({ name: "push" })
                let mergePushElementsWithNext = new Array<Expression | SpreadElement>()
                return new CallExpression({
                    callee: new ArrowFunctionExpression({
                        params: [ new Parameter({ id }) ],
                        expression: false,
                        body: new BlockStatement({
                            body: traverse(node.elements, {
                                enter(e) {
                                    //  don't traverse into call expressions
                                    //  also don't recurse into expressions or expression statements
                                    //  basically we only want to recurse into control flow statements
                                    if (CallExpression.is(e) || Expression.is(e) || ExpressionStatement.is(e)) {
                                        return skip
                                    }
                                },
                                leave(e, ancestors, path) {
                                    //  if this is an immediate child expression we treat it as a statement
                                    //  so it gets converted to an ExpressionStatement down below.
                                    let parent = ancestors[ancestors.length - 1]
                                    let statement = parent === node.elements
                                    if (ExpressionStatement.is(e)) {
                                        e = e.expression
                                        statement = true
                                    }
                                    // if (SpreadElement.is(e)) {
                                    //     throw SemanticError("Spread not implemented yet", e)
                                    // }
                                    if ((Expression.is(e) || SpreadElement.is(e)) && Array.isArray(parent)) {
                                        // see if the next peer element is an expression or expression statement
                                        let nextPeer = ancestors[ancestors.length - 1][path[path.length - 1] + 1]
                                        if (Expression.is(nextPeer) || SpreadElement.is(nextPeer) || ExpressionStatement.is(nextPeer)) {
                                            mergePushElementsWithNext.push(e)
                                            return remove
                                        }
                                        let expression = new CallExpression({
                                            callee: new MemberExpression({
                                                object: ref,
                                                property: push
                                            }),
                                            arguments: [...mergePushElementsWithNext, e]
                                        })
                                        mergePushElementsWithNext.length = 0
                                        return statement ? new ExpressionStatement({ expression }) : expression
                                    }
                                }
                            }).concat([ new ReturnStatement({ argument: ref })])
                        })
                    }),
                    arguments: [ new ArrayExpression({ elements: [] }) ]
                })
            }
        }
    })
}
