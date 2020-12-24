import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { BinaryExpression, ClassDeclaration, ElementExpression, Program, UnaryExpression, VariableDeclaration } from "../ast"
import { SemanticError } from "../common"
import Assembly from "../ast/Assembly"
import toCodeString from "../toCodeString"

export default function semanticAnalysis(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node, ancestors) {
            if (VariableDeclaration.is(node)) {
                let container = ancestors[ancestors.length - 2]
                if (node.static && !ClassDeclaration.is(container)) {
                    throw SemanticError("static modifier only valid within class", node.static)
                }
            }
            if (ClassDeclaration.is(node)) {
                if (!node.isData && node.baseClasses.length > 1) {
                    throw SemanticError("only data classes support multiple inheritance", node.baseClasses[1])
                }
            }
            if (ElementExpression.is(node)) {
                if (node.close != null && toCodeString(node.kind) !== toCodeString(node.close)) {
                    throw SemanticError("closing element does not match opening element", node.close)
                }
            }
        },
        leave(node) {
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
