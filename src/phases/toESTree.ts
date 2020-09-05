import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Exportable, Node, Program } from "../ast"
import Position from "../ast/Position"
import VariableDeclaration from "../ast/VariableDeclaration"
import Reference from "../ast/Reference"
import MemberExpression from "../ast/MemberExpression"
import Expression from "../ast/Expression"
import Declaration from "../ast/Declaration"

export default function toEsTree(root: Map<string, any>, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Position.is(node)) {
                return skip
            }
        },
        merge(node, changes, helper) {
            if (Node.is(node)) {
                // Convert Reference to Identifier
                if (Reference.is(node)) {
                    return {
                        type: "Identifier",
                        name: node.name
                    }
                }
                // Our VariableDeclarations diverge from ESTree for simplicity so we convert back.
                let result: any
                if (VariableDeclaration.is(node)) {
                    let values = { ...node, ...changes }
                    result = {
                        type: "VariableDeclaration",
                        kind: node.assignable ? "let" : "const",
                        declarations: [{
                            type: "VariableDeclarator",
                            id: values.id,
                            init: values.value,
                        }]
                    }
                }
                else {
                    result = { type: node.constructor.name, ...node, ...changes }
                }
                // Add computed to MemberExpressions with Expressions as their property.
                if (MemberExpression.is(node) && Expression.is(node.property)) {
                    result.computed = true
                }
                if (Exportable.is(node) && node.export > 0) {
                    result = {
                        type: node.export === 2 ? "ExportDefaultDeclaration" : "ExportNamedDeclaration",
                        declaration: result,
                        specifiers: [],
                        source: null,
                    }
                }
                return result
            }
        }
    })
}
