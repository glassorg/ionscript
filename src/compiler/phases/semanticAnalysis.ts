import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { ClassDeclaration, Program, VariableDeclaration } from "../ast"
import { SemanticError } from "../common"
import Assembly from "../ast/Assembly"

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
        }
    })
}
