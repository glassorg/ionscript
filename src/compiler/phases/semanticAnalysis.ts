import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { ClassDeclaration, Program, VariableDeclaration } from "../ast"
import ImportDeclaration from "../ast/ImportDeclaration"
import ImportNamespaceSpecifier from "../ast/ImportNamespaceSpecifier"
import ImportDefaultSpecifier from "../ast/ImportDefaultSpecifier"
import ImportSpecifier from "../ast/ImportSpecifier"
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

        }
    })
}
