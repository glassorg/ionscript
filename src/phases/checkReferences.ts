import createScopeMaps from "../createScopeMaps";
import Assembly from "../ast/Assembly";
import { traverse } from "@glas/traverse";
import { SemanticError } from "../common";
import Reference from "../ast/Reference";

export default function checkReferences(root: Assembly) {
    let scopes = createScopeMaps(root)
    traverse(root, {
        enter(node) {
            if (Reference.is(node)) {
                let scope = scopes.get(node)
                let declarator = scope[node.name]
                if (declarator == null) {
                    console.log(`Reference not found: ${node.name}`)
                    // throw SemanticError(`Reference not found: ${node.name}`, node)
                }
            }
        }
    })
    return root
}
