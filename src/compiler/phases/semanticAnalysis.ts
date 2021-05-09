import { Options } from "../Compiler"
import { traverse, replace } from "@glas/traverse"
import { BinaryExpression, ClassDeclaration, Declarator, ElementExpression, ForOfStatement, FunctionExpression, Identifier, Literal, Program, Reference, RestElement, ReturnStatement, UnaryExpression, VariableDeclaration, YieldExpression } from "../ast"
import { SemanticError } from "../common"
import Assembly from "../ast/Assembly"
import toCodeString from "../toCodeString"
import * as types from "../types";
import LoopStatement from "../ast/LoopStatement"
import { findProperty } from "./controlFlowToExpressions"
import { Property } from "../.."

function isFirstAncestorLoopOrElement(ancestors: any[]) {
    for (let i = ancestors.length; i >= 0; i--) {
        let node = ancestors[i]
        if (LoopStatement.is(node)) {
            return true
        }
        if (ElementExpression.is(node) || ReturnStatement.is(node) || FunctionExpression.is(node)) {
            return false
        }
    }
    return false
}

export default function semanticAnalysis(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node, ancestors, path) {
            if (VariableDeclaration.is(node)) {
                let container = ancestors[ancestors.length - 2]
                if (node.static && !ClassDeclaration.is(container)) {
                    throw SemanticError("Static modifier only valid within class", node.static)
                }
                let parent = ancestors[ancestors.length - 1]
                if (node.kind !== "var" && !ClassDeclaration.is(parent) && node.value == null) {
                    if (!(ForOfStatement.is(parent) && path[path.length - 1] === "count")) {
                        throw SemanticError("Variable must be initialized", node)
                    }
                }
                if (Declarator.is(node.id) && node.id.name === "properties" && (node.instance || node.static)) {
                    let containingClass = ancestors.reverse().find(ClassDeclaration.is)
                    if (ClassDeclaration.is(containingClass) && containingClass.isData) {
                        throw SemanticError("Data Classes/Structs can not have a variable named 'properties'", node.id)
                    }
                }
            }
            if (ClassDeclaration.is(node)) {
                if (!node.isData && node.baseClasses.length > 1) {
                    throw SemanticError("Only data classes support multiple inheritance", node.baseClasses[1])
                }
            }
            if (ElementExpression.is(node)) {
                if (node.close != null && toCodeString(node.kind) !== toCodeString(node.close)) {
                    throw SemanticError("Closing element does not match opening element", node.close)
                }
                // check that if this element has a for loop parent... that it provides a 'key'
                if (isFirstAncestorLoopOrElement(ancestors)) {
                    let keyProperty = findProperty(node.properties) as Property | null
                    if (keyProperty == null) {
                        throw SemanticError(`JSXElement within loop needs a key property`, node)
                    }
                    if (Literal.is(keyProperty.value)) {
                        // we could check that the declared value isn't a constant, but meh.
                        throw SemanticError(`JSXElement key within loop should vary each iteration`, keyProperty.value)
                    }
                }
            }
            if (YieldExpression.is(node)) {
                let func = ancestors.find(FunctionExpression.is) as FunctionExpression
                if (func.bind) {
                    throw SemanticError("Cannot 'yield' from bound functions (=>) use normal functions (->)", node)
                }
                if (!func.generator) {
                    throw SemanticError("Can only 'yield' from generator functions. Add a * before the function parameters or name: *() -> ", node)
                }
            }
        },
        leave(node) {
            if (ClassDeclaration.is(node) && node.export >= 2) {
                let { location } = node.id
                return replace(
                    node.patch({ export: 0 }),
                    new VariableDeclaration({
                        location,
                        id: new Declarator({ location, name: "default" }),
                        kind: "let",
                        export: 2,
                        value: new Reference(node.id)
                    })
                )
            }
            if (BinaryExpression.is(node)) {
                let { location } = node
                if (node.operator === "isnt") {
                    return new UnaryExpression({
                        location,
                        operator: "!",
                        prefix: true,
                        argument: node.patch({ operator: "is" }),
                    })
                }
            }
            if (FunctionExpression.is(node)) {
                // check that only a single RestElement max and is final arg
                for (let i = 0; i < node.params.length; i++) {
                    let param = node.params[i]
                    if (RestElement.is(param.id)) {
                        // must be last parameter
                        if (i + 1 < node.params.length) {
                            throw SemanticError(`Rest element must be final parameter`, param)
                        }
                        let { type } = param
                        if (type) {
                            if (!Reference.is(type) || type.path !== types.Array.path) {
                                if ((type as any).name === "Array") {
                                    console.log("TODO: Fix semanticAnalysis type is 'Array' but not global:Array")
                                    return
                                }
                                throw SemanticError(`Rest element type must be an Array`, type)
                            }
                        }
                    }
                }
            }
        }
    })
}
