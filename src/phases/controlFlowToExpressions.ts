import { Options } from "../Compiler"
import { traverse, skip, remove } from "@glas/traverse"
import { ArrayExpression, BlockStatement, CallExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, Literal, MapExpression, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, ReturnStatement, SpreadElement, Statement } from "../ast"
import Assembly from "../ast/Assembly"
import { SemanticError } from "../common"
import ArrowFunctionExpression from "../ast/ArrowFunctionExpression"
import PropertyStatement from "../ast/PropertyStatement"
import AssignmentStatement from "../ast/AssignmentStatement"

const containerName = "$"
const containerRef = new Reference({ name: containerName })
const containerId = new Identifier({ name: containerName })

export default function controlFlowToExpressions(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
        },
        leave(node) {
            const isMap = MapExpression.is(node)
            if ((ObjectExpression.is(node) || isMap) && node.properties.find(Statement.is)) {
                return new CallExpression({
                    callee: new ArrowFunctionExpression({
                        params: [ new Parameter({ id: containerId }) ],
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
                                        if (isMap) {
                                            let { key, value } = e
                                            if (Identifier.is(key)) {
                                                //  keys are always computed for Maps.
                                                key = new Reference(key)
                                            }
                                            return new ExpressionStatement({
                                                expression: new CallExpression({
                                                    callee: new MemberExpression({
                                                        object: containerRef,
                                                        property: new Identifier({ name: "set" })
                                                    }),
                                                    arguments: [e.key as Expression, e.value as Expression]
                                                })
                                            })
                                        }
                                        else {
                                            return new AssignmentStatement({
                                                left: new MemberExpression({
                                                    object: containerRef,
                                                    property: e.key,
                                                }),
                                                operator: "=",
                                                right: e.value as Expression,
                                            })
                                        }
                                    }
                                }
                            }).concat([ new ReturnStatement({ argument: containerRef })])
                        })
                    }),
                    arguments: [
                        isMap
                            ? new CallExpression({ new: true, callee: new Reference({ name: "Map"}), arguments: []})
                            : new ObjectExpression({ properties: [] })
                    ]
                })
            }
            else if (isMap) {
                return new CallExpression({
                    new: true,
                    callee: new Reference({ name: "Map" }),
                    arguments: [
                        new ArrayExpression({
                            elements: node.properties.map(({ key, value }) => new ArrayExpression({ elements: [ key, value ]}))
                        })
                    ]
                })
            }
            else if (ArrayExpression.is(node) && node.elements.find(Statement.is)) {
                let push = new Identifier({ name: "push" })
                let mergePushElementsWithNext = new Array<Expression | SpreadElement>()
                return new CallExpression({
                    callee: new ArrowFunctionExpression({
                        params: [ new Parameter({ id: containerId }) ],
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
                                    if ((Expression.is(e) || SpreadElement.is(e)) && Array.isArray(parent)) {
                                        // see if the next peer element is an expression or expression statement
                                        let nextPeer = ancestors[ancestors.length - 1][path[path.length - 1] + 1]
                                        if (Expression.is(nextPeer) || SpreadElement.is(nextPeer) || ExpressionStatement.is(nextPeer)) {
                                            mergePushElementsWithNext.push(e)
                                            return remove
                                        }
                                        let expression = new CallExpression({
                                            callee: new MemberExpression({
                                                object: containerRef,
                                                property: push
                                            }),
                                            arguments: [...mergePushElementsWithNext, e]
                                        })
                                        mergePushElementsWithNext.length = 0
                                        return statement ? new ExpressionStatement({ expression }) : expression
                                    }
                                }
                            }).concat([ new ReturnStatement({ argument: containerRef })])
                        })
                    }),
                    arguments: [ new ArrayExpression({ elements: [] }) ]
                })
            }
        }
    })
}
