import { Options } from "../Compiler"
import { traverse, skip, remove } from "@glas/traverse"
import { ArrayExpression, BinaryExpression, BlockStatement, CallExpression, Declarator, ElementExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, ImportDeclaration, ImportNamespaceSpecifier, ImportSpecifier, Literal, Location, MemberExpression, Node, ObjectExpression, OutlineOperation, Parameter, Program, Property, Reference, ReturnStatement, SpreadElement, Statement, AssignmentExpression } from "../ast"
import Assembly from "../ast/Assembly"
import ArrowFunctionExpression from "../ast/ArrowFunctionExpression"
import { hasDeclarator, SemanticError } from "../common"

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
                                    return new ExpressionStatement({
                                        location,
                                        expression: new AssignmentExpression({
                                            location,
                                            left: new MemberExpression({
                                                location,
                                                object: containerRef,
                                                property: e.key,
                                            }),
                                            operator: "=",
                                            right: e.value as Expression,
                                        })
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
        //  TODO: extend ionscript.add to handle Sets and convert to use it.
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
    else if (ElementExpression.is(node)) {
        let { children } = node
        // convert Named FunctionExpressions into equivalent Property's.
        children = children.map(child => {
            if (FunctionExpression.is(child) && child.id != null) {
                return new Property({
                    location,
                    key: child.id,
                    value: child,
                    method: true,
                })
            }
            return child
        })

        let hasNonPropertyStatements = children.find(Statement.is) != null
        const propertiesName = "$"
        const childrenName = "children"
        let kind = node.kind
        //  lower case references use strings as they represent elements
        if (Reference.is(kind) && kind.name[0] === kind.name[0].toLowerCase()) {
            kind = new Literal({ location, value: kind.name })
        }
        if (hasNonPropertyStatements) {
            const mergePushElementsWithNext = new Array<Expression | SpreadElement>()
            let addedChildren = false
            return new CallExpression({
                location,
                callee: new ArrowFunctionExpression({
                    location,
                    params: [
                        new Parameter({ location, id: new Declarator({ location, name: propertiesName}) }),
                        // new Parameter({ location, id: new Declarator({ location, name: childrenName}) }),
                    ],
                    expression: false,
                    body: new BlockStatement({
                        location,
                        body: traverse(children, {
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
                                if (ExpressionStatement.is(e)) {
                                    e = e.expression
                                }
                                if (FunctionExpression.is(e) && e.id != null) {
                                    // convert a named function expression into an equivalent property
                                    e = new Property({ key: e.id, value: e })
                                }
                    
                                if (Property.is(e) && Array.isArray(parent)) {
                                    //  we do NOT allow properties to be set AFTER children have been added
                                    //  it would make it difficult to differentiate the properties from the children.
                                    if (addedChildren) {
                                        throw SemanticError(`Properties must be set before children`, e)
                                    }
                                    return new ExpressionStatement({
                                        location,
                                        expression: new AssignmentExpression({
                                            location,
                                            left: new MemberExpression({
                                                location,
                                                object: new Reference({ location, name: propertiesName }),
                                                property: e.key,
                                            }),
                                            operator: "=",
                                            right: e.value as Expression,
                                        })
                                    })
                                }
                                if ((Expression.is(e) || SpreadElement.is(e)) && Array.isArray(parent)) {
                                    addedChildren = true
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
                                            object: new MemberExpression({
                                                location,
                                                object: new Reference({ location, name: propertiesName }),
                                                property:  new Identifier({ location, name: childrenName }),
                                            }),
                                            property: new Identifier({ location, name: "push" }),
                                        }),
                                        arguments: [...mergePushElementsWithNext, e]
                                    })
                                    mergePushElementsWithNext.length = 0
                                    return new ExpressionStatement({ location, expression })
                                }
                            }
                        }).concat([
                            new ReturnStatement({
                                location,
                                argument: new CallExpression({
                                    location,
                                    callee: new Reference({ location, name: "jsx" }),
                                    arguments: [
                                        kind,
                                        new Reference({ location, name: propertiesName }),
                                        // new Reference({ location, name: childrenName }),
                                    ]
                                })
                            })
                        ])
                    })
                }),
                arguments: [
                    new ObjectExpression({
                        location,
                        properties: [
                            ...node.properties,
                            new Property({
                                location,
                                key: new Identifier({ location, name: childrenName }),
                                value: new ArrayExpression({ location, elements: [] })
                            })
                        ]
                    }),
                ]
            })
        }
        // we are converting this into a simple createElement(kind, properties, ...children) function call
        {
            let properties = [ ...node.properties ]
            let children: Array<any> = []
            for (let child of node.children) {
                if (Property.is(child)) {
                    properties.push(child)
                }
                else if (FunctionExpression.is(child) && child.id != null) {
                    properties.push(new Property({
                        location,
                        key: child.id,
                        value: child,
                        method: true,
                    }))
                }
                else {
                    if (!(Expression.is(child) || SpreadElement.is(child))) {
                        throw SemanticError("Expected Expression or SpreadElement", child)
                    }
                    children.push(child)
                }
            }
            //  TODO: We should probably just output JSX
            let args: Array<any> = [
                kind,
                new ObjectExpression({
                    location,
                    properties: [
                        ...properties,
                        new Property({
                            location,
                            key: new Identifier({ location, name: "children" }),
                            value: new ArrayExpression({ location, elements: children })
                        })
                    ]
                })
                // ...children
            ]
            return new CallExpression({
                location,
                callee: new Reference({ location, name: "jsx" }),
                arguments: args
            })
        }
    }
}

export default function controlFlowToExpressions(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Program.is(node)) {
                return skip
            }
        },
        leave(node) {
            let { location } = node
            if (Program.is(node)) {
                let hasJsxElements = false
                let program = traverse(node, {
                    leave(node) {
                        if (ElementExpression.is(node)) {
                            hasJsxElements = true
                        }
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
                // add jsx import statement
                if (hasJsxElements && ! hasDeclarator(program.body, "jsx") ) {
                    program = program.patch({
                        body: [
                            new ImportDeclaration({
                                location,
                                specifiers: [
                                    new ImportSpecifier({
                                        location,
                                        local: new Declarator({ name: "jsx", location }),
                                        imported: new Reference({ name: "jsx", location })
                                    })
                                ],
                                source: new Literal({ value: "preact/jsx-runtime", location })
                            }),
                            ...program.body
                        ]
                    })
    
                }
                return program
            }
        }
    })
}
