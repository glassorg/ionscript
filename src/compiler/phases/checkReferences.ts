import createScopeMaps from "../createScopeMaps";
import { traverse, remove } from "@glas/traverse";
import { Assembly, ClassDeclaration, Declaration, Declarator, Exportable, FunctionExpression, Identifier, ImportDeclaration, Location, MemberExpression, ModuleSpecifier, Node, Program, Reference, RestElement, ThisExpression, VariableDeclaration } from "../ast";
import { getAncestor, getOriginalDeclarator, memoizeIntern, SemanticError } from "../common";
import { getGlobalReference, getModulePath } from "../pathFunctions";
import toCodeString from "../toCodeString";
import * as types from "../types";
import reservedWords from "../reservedWords";
import { Options } from "../Compiler";

export default function checkReferences(root: Assembly, options: Options) {
    let ancestorsMap = new Map<Node, Node>()
    let scopes = createScopeMaps(root, { ancestorsMap })
    let getName = memoizeIntern((d: Declarator) => {
        d = getOriginalDeclarator(d, scopes, ancestorsMap, false)!
        if (d == null) {
            return null
        }
        let parent = ancestorsMap.get(d)
        let { name } = d
        let location: Location | undefined
        if (Program.is(parent)) {
            name = ""
        }
        else if (Exportable.is(parent) && parent.export !== 0) {
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
            // we also set variable id onto function expressions if they aren't named already
            if (VariableDeclaration.is(node)) {
                if (Identifier.is(node.id) && FunctionExpression.is(node.value) && node.value.id == null) {
                    // but NOT if they are reserved
                    let name = node.kind === "type" ? `is${node.id.name}` : node.id.name
                    if (!reservedWords.has(node.id.name)) {
                        return node.patch({
                            value: node.value.patch({
                                id: new Declarator({
                                    location: node.location,
                                    name,
                                    path: node.id.path
                                })
                            })
                        })
                    }
                }
            }
            if (Declarator.is(node)) {
                return node.patch({ path: getName(node) })
            }
            if (Reference.is(node)) {
                let scope = scopes.get(node)
                if (scope == null) {
                    //  we might have been mutated by a changed template sub-reference
                    //  so we will use our unmutated ancestors scope if needed
                    scope = scopes.get(ancestors[ancestors.length - 1])
                    if (scope == null) {
                        console.log("scope not found for: ", node.location?.filename + " " + node.name)
                        return
                    }
                }
                let declarator = scope[node.name]
                if (declarator == null) {
                    // if we cannot find a declarator then this must be a global reference
                    return getGlobalReference(node)
                }
                else {
                    // let declaration = getAncestor(declarator, ancestorsMap, Declaration.is)
                    // if (VariableDeclaration.is(declaration)) {
                    //     let cls = getAncestor(declaration, ancestorsMap, ClassDeclaration.is)
                    //     if (declaration.instance && cls!.instance.declarations.find(d => (d.id as Declarator)?.name === node.name)) {
                    //         // check that this isn't contained within a -> function nested within the local function
                    //         //  that would cause 'this' values to be not bound
                    //         let func = getAncestor(node, ancestorsMap, FunctionExpression.is)
                    //         if (func) {
                    //             if (func !== declaration.value && !func.bind) {
                    //                 options.errors.push(SemanticError(`Function implicitly references this.${node.name}, use a bound function "=>"`, node))
                    //             }
                    //         }
                    //         // add implied this. to instance property references
                    //         return new MemberExpression({
                    //             object: new ThisExpression({}),
                    //             property: new Identifier(node)
                    //         })
                    //     }
                    //     else if (declaration.static && cls!.static.find(d => (d.id as Declarator)?.name === node.name)) {
                    //         //  add implied Class. to static property references
                    //         let classDeclaration = getAncestor(node, ancestorsMap, ClassDeclaration.is)
                    //         // declaratorAncestors[declaratorAncestors.length - 3] as ClassDeclaration
                    //         return new MemberExpression({
                    //             object: new Reference(classDeclaration!.id),
                    //             property: new Identifier(node)
                    //         })
                    //     }
                    // }
                    // return node.patch({ path: getName(declarator) })
                }
            }
            // // semantic checks.
            // if (FunctionExpression.is(node)) {
            //     // check that only a single RestElement max and is final arg
            //     for (let i = 0; i < node.params.length; i++) {
            //         let param = node.params[i]
            //         if (RestElement.is(param.id)) {
            //             // must be last parameter
            //             if (i + 1 < node.params.length) {
            //                 throw SemanticError(`Rest element must be final parameter`, param)
            //             }
            //             let { type } = param
            //             if (type) {
            //                 if (!Reference.is(type) || type.path !== types.Array.path) {
            //                     throw SemanticError(`Rest element type must be an Array`, type)
            //                 }
            //             }
            //         }
            //     }
            // }            
        }
    })
}
