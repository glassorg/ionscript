import createScopeMaps from "../createScopeMaps";
import { traverse } from "@glas/traverse";
import { Assembly, ClassDeclaration, Identifier, MemberExpression, Node, Reference, ThisExpression, VariableDeclaration } from "../ast";

export default function checkReferences(root: Assembly) {
    let ancestorsMap = new Map<Node, any[]>()
    let scopes = createScopeMaps(root, { ancestorsMap })
    return traverse(root, {
        leave(node, ancestors) {
            if (Reference.is(node)) {
                let scope = scopes.get(node)
                if (scope == null) {
                    console.log("scope not found for: ", node)
                }
                let declarator = scope[node.name]
                if (declarator == null) {
                    // console.log(`Reference not found: ${node.name}`)
                    // throw SemanticError(`Reference not found: ${node.name}`, node)
                }
                else {
                    let declaratorAncestors = ancestorsMap.get(declarator)
                    if (declaratorAncestors) {
                        let declaration = declaratorAncestors[declaratorAncestors.length - 1]
                        if (VariableDeclaration.is(declaration)) {
                            if (declaration.instance) {
                                // add implied this. to instance property references
                                return new MemberExpression({
                                    object: new ThisExpression({}),
                                    property: new Identifier(node)
                                })
                            }
                            else if (declaration.static) {
                                //  add implied Class. to static property references
                                let classDeclaration = declaratorAncestors[declaratorAncestors.length - 3] as ClassDeclaration
                                return new MemberExpression({
                                    object: new Reference(classDeclaration.id),
                                    property: new Identifier(node)
                                })
                            }
                        }
                    }
                }
            }
        }
    })
}
