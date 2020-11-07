import { Options } from "../Compiler"
import { traverse, skip, remove } from "@glas/traverse"
import { ArrayExpression, BinaryExpression, BlockStatement, CallExpression, Declarator, Expression, ExpressionStatement, FunctionExpression, Identifier, Literal, MemberExpression, Node, ObjectExpression, OutlineOperation, Parameter, Program, Property, Reference, ReturnStatement, SpreadElement, Statement } from "../ast"
import Assembly from "../ast/Assembly"
import ArrowFunctionExpression from "../ast/ArrowFunctionExpression"
import PropertyStatement from "../ast/PropertyStatement"
import AssignmentStatement from "../ast/AssignmentStatement"

function convertExpressionWithNestedStatements(node) {
    const { location } = node
    const containerName = "$"
    const containerRef = new Reference({ location, name: containerName })
    const containerId = new Declarator({ location, name: containerName })
    const isObjectExpression = ObjectExpression.is(node)
    const isMap = isObjectExpression && node.isMap
    const isArrayExpression = ArrayExpression.is(node)
    const isSet = isArrayExpression && node.isSet
    if (isObjectExpression && node.properties.find(Statement.is)) {
        return new CallExpression({
            location,
            callee: new ArrowFunctionExpression({
                params: [ new Parameter({ location, id: containerId }) ],
                expression: false,
                body: new BlockStatement({
                    location,
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
                                            location,
                                            callee: new MemberExpression({
                                                location,
                                                object: containerRef,
                                                property: new Identifier({ location, name: "set" })
                                            }),
                                            arguments: [e.key as Expression, e.value as Expression]
                                        })
                                    })
                                }
                                else {
                                    return new AssignmentStatement({
                                        location,
                                        left: new MemberExpression({
                                            location,
                                            object: containerRef,
                                            property: e.key,
                                        }),
                                        operator: "=",
                                        right: e.value as Expression,
                                    })
                                }
                            }
                        }
                    }).concat([ new ReturnStatement({ location, argument: containerRef })])
                })
            }),
            arguments: [
                isMap
                    ? new CallExpression({ location, new: true, callee: new Reference({ location, name: "Map"}), arguments: []})
                    : new ObjectExpression({ location, properties: [] })
            ]
        })
    }
    else if (isMap) {
        return new CallExpression({
            location,
            new: true,
            callee: new Reference({ location, name: "Map" }),
            arguments: [
                new ArrayExpression({
                    location,
                    elements: node.properties.map(({ key, value }) => new ArrayExpression({ location, elements: [ key, value ]}))
                })
            ]
        })
    }
    else if (isArrayExpression && node.elements.find(Statement.is)) {
        const push = new Identifier({ location, name: isSet ? "add" : "push" })
        const mergePushElementsWithNext = new Array<Expression | SpreadElement>()
        return new CallExpression({
            location,
            callee: new ArrowFunctionExpression({
                location,
                params: [ new Parameter({ location, id: containerId }) ],
                expression: false,
                body: new BlockStatement({
                    location,
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
                                    location,
                                    callee: new MemberExpression({
                                        location,
                                        object: containerRef,
                                        property: push
                                    }),
                                    arguments: [...mergePushElementsWithNext, e]
                                })
                                mergePushElementsWithNext.length = 0
                                return statement ? new ExpressionStatement({ location, expression }) : expression
                            }
                        }
                    }).concat([ new ReturnStatement({ location, argument: containerRef })])
                })
            }),
            arguments: [
                isSet
                ? new CallExpression({ location, new: true, callee: new Reference({ location, name: "Set"}), arguments: []})
                : new ArrayExpression({ location, elements: [] })
            ]
        })
    }
    else if (isSet) {
        return new CallExpression({
            location,
            new: true,
            callee: new Reference({ location, name: "Set" }),
            arguments: [ node.patch({ isSet: false }) ]
        })
    }
}

export default function controlFlowToExpressions(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
        },
        leave(node) {
            let { location } = node
            if (CallExpression.is(node) && node.arguments.find(Statement.is)) {
                return node.patch({
                    arguments: [
                        new SpreadElement({
                            location,
                            argument: convertExpressionWithNestedStatements(new ArrayExpression({ location, elements: node.arguments }))!
                        })
                    ]
                })
            }
            if (OutlineOperation.is(node)) {
                let { operator } = node
                let operands = new ArrayExpression({ location, elements: node.operands })
                return new CallExpression({
                    location,
                    callee: new MemberExpression({
                        location,
                        object: convertExpressionWithNestedStatements(operands) ?? operands,
                        property: new Identifier({ location, name: "reduce" })
                    }),
                    arguments: [
                        new ArrowFunctionExpression({
                            location,
                            params: [
                                new Parameter({ location, id:  new Declarator({ location, name: "a"}) }),
                                new Parameter({ location, id:  new Declarator({ location, name: "c"}) }),
                            ],
                            body: new BinaryExpression({
                                location,
                                left: new Reference({ location, name: "a"}),
                                operator,
                                right: new Reference({ location, name: "c"})
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
