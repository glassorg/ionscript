import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import { BinaryExpression, ClassDeclaration, Declarator, ElementExpression, FunctionExpression, Program, Reference, UnaryExpression, VariableDeclaration, YieldExpression } from "../ast"
import { getAncestor, SemanticError } from "../common"
import Assembly from "../ast/Assembly"
import toCodeString from "../toCodeString"
import { WSASERVICE_NOT_FOUND } from "constants"

export default function semanticAnalysis(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node, ancestors) {
            if (VariableDeclaration.is(node)) {
                let container = ancestors[ancestors.length - 2]
                if (node.static && !ClassDeclaration.is(container)) {
                    throw SemanticError("Static modifier only valid within class", node.static)
                }
                let parent = ancestors[ancestors.length - 1]
                if (node.kind !== "var" && !ClassDeclaration.is(parent) && node.value == null) {
                    throw SemanticError("Variable must be initialized", node)
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
        }
    })
}
