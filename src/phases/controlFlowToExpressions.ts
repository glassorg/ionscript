import { Options } from "../Compiler"
import { traverse, skip, remove } from "@glas/traverse"
import { ArrayExpression, BinaryExpression, BlockStatement, CallExpression, Declarator, Expression, ExpressionStatement, FunctionExpression, Identifier, Literal, MemberExpression, ObjectExpression, OutlineOperation, Parameter, Program, Property, Reference, ReturnStatement, SpreadElement, Statement } from "../ast"
import Assembly from "../ast/Assembly"
import { SemanticError } from "../common"
import ArrowFunctionExpression from "../ast/ArrowFunctionExpression"
import PropertyStatement from "../ast/PropertyStatement"
import AssignmentStatement from "../ast/AssignmentStatement"

const containerName = "$"
const containerRef = new Reference({ name: containerName })
const containerId = new Declarator({ name: containerName })

function convertExpressionWithNestedStatements(node) {
    const isObjectExpression = ObjectExpression.is(node)
    const isMap = isObjectExpression && node.isMap
    const isArrayExpression = ArrayExpression.is(node)
    const isSet = isArrayExpression && node.isSet
    if (isObjectExpression && node.properties.find(Statement.is)) {
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
    else if (isArrayExpression && node.elements.find(Statement.is)) {
        const push = new Identifier({ name: isSet ? "add" : "push" })
        const mergePushElementsWithNext = new Array<Expression | SpreadElement>()
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
                                let mergeWithNext = false
                                if (!isSet) {
                                    let nextPeer = ancestors[ancestors.length - 1][path[path.length - 1] + 1]
                                    if (Expression.is(nextPeer) || SpreadElement.is(nextPeer) || ExpressionStatement.is(nextPeer))
                                        mergeWithNext = true
                                }
                                if (mergeWithNext) {
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
            arguments: [
                isSet
                ? new CallExpression({ new: true, callee: new Reference({ name: "Set"}), arguments: []})
                : new ArrayExpression({ elements: [] })
            ]
        })
    }
    else if (isSet) {
        return new CallExpression({
            new: true,
            callee: new Reference({ name: "Set" }),
            arguments: [ node.patch({ isSet: false }) ]
        })
    }
}

export default function controlFlowToExpressions(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
        },
        leave(node) {
            if (CallExpression.is(node) && node.arguments.find(Statement.is)) {
                return node.patch({
                    arguments: [
                        new SpreadElement({
                            argument: convertExpressionWithNestedStatements(new ArrayExpression({ elements: node.arguments }))!
                        })
                    ]
                })
            }
            if (OutlineOperation.is(node)) {
                let { operator } = node
                let operands = new ArrayExpression({ elements: node.operands })
                return new CallExpression({
                    callee: new MemberExpression({
                        object: convertExpressionWithNestedStatements(operands) ?? operands,
                        property: new Identifier({ name: "reduce" })
                    }),
                    arguments: [
                        new ArrowFunctionExpression({
                            params: [
                                new Parameter({ id:  new Declarator({ name: "a"}) }),
                                new Parameter({ id:  new Declarator({ name: "c"}) }),
                            ],
                            body: new BinaryExpression({
                                left: new Reference({ name: "a"}),
                                operator,
                                right: new Reference({ name: "c"})
                            }),
                            expression: true
                        })
                    ]
                })
            }
            return convertExpressionWithNestedStatements(node)
        }
    })
}
