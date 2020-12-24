import createScopeMaps from "../createScopeMaps";
import { traverse, skip } from "@glas/traverse";
import { Assembly, Reference } from "../ast";
import { getGlobalReference } from "../pathFunctions";

export default function addIonscriptGlobalReferences(root: Assembly) {
    let scopes = createScopeMaps(root)
    return traverse(root, {
        enter(node) {
            if (Reference.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (Reference.is(node)) {
                let scope = scopes.get(node)
                let declarator = scope[node.name]
                if (declarator == null) {
                    // if we cannot find a declarator then this must be a global reference
                    return getGlobalReference(node)
                }

            }        
        }
    })
}
