import createScopeMaps from "../createScopeMaps";
import { traverse, remove } from "@glas/traverse";
import { Assembly, ClassDeclaration, Declaration, Declarator, Exportable, Identifier, ImportDeclaration, Location, MemberExpression, ModuleSpecifier, Node, Program, Reference, ThisExpression, VariableDeclaration } from "../ast";
import { getAncestor, getOriginalDeclarator, memoizeIntern } from "../common";
import { getGlobalPath, getModulePath } from "../pathFunctions";

export default function checkReferences(root: Assembly) {
    let ancestorsMap = new Map<Node, Node>()
    let scopes = createScopeMaps(root, { ancestorsMap })
    let getName = memoizeIntern((d: Declarator) => {
        d = getOriginalDeclarator(d, scopes, ancestorsMap)!
        let parent = ancestorsMap.get(d)
        let { name } = d
        let location: Location | undefined
        if (Program.is(parent)) {
            name = ""
        }
        else if (Exportable.is(parent)) {
            if (parent.export === 2) {
                name = "default"
            }
        }
        else {
            location = d.location!
        }
        return getModulePath(d.location!.filename, name, location)
    })
    return traverse(root, {
        leave(node, ancestors) {
            if (Declarator.is(node)) {
                return node.patch({ path: getName(node) })
            }
            if (Reference.is(node)) {
                let scope = scopes.get(node)
                if (scope == null) {
                    console.log("scope not found for: ", node)
                }
                let declarator = scope[node.name]
                if (declarator == null) {
                    // if we cannot find a declarator then this must be a global reference
                    return node.patch({ path: getGlobalPath(node.name) })
                }
                else {
                    let declaration = ancestors[ancestors.length - 1]
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
                            let classDeclaration = getAncestor(node, ancestorsMap, ClassDeclaration.is)
                            // declaratorAncestors[declaratorAncestors.length - 3] as ClassDeclaration
                            return new MemberExpression({
                                object: new Reference(classDeclaration!.id),
                                property: new Identifier(node)
                            })
                        }
                    }
                    return node.patch({ path: getName(declarator) })
                }
            }
        }
    })
}
