import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Node, Program } from "../ast"
import Position from "../ast/Position"
import VariableDeclaration from "../ast/VariableDeclaration"
import Reference from "../ast/Reference"
import MemberExpression from "../ast/MemberExpression"
import Expression from "../ast/Expression"

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
                if (VariableDeclaration.is(node)) {
                    let values = { ...node, ...changes }
                    return {
                        type: "VariableDeclaration",
                        kind: node.assignable ? "let" : "const",
                        declarations: [{
                            type: "VariableDeclarator",
                            id: values.id,
                            init: values.value,
                        }]
                    }
                }
                let result = { type: node.constructor.name, ...node, ...changes }
                // Add computed to MemberExpressions with Expressions as their property.
                if (MemberExpression.is(node) && Expression.is(node.property)) {
                    result.computed = true
                }
                return result
            }
        }
    })
}
