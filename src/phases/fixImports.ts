import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Program } from "../ast"
import ImportDeclaration from "../ast/ImportDeclaration"
import ImportNamespaceSpecifier from "../ast/ImportNamespaceSpecifier"
import ImportDefaultSpecifier from "../ast/ImportDefaultSpecifier"
import ImportSpecifier from "../ast/ImportSpecifier"
import { SemanticError } from "../common"
import Assembly from "../ast/Assembly"

export default function fixImports(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Program.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (Program.is(node)) {
                let originalImports = node.body.filter(node => ImportDeclaration.is(node)) as ImportDeclaration[]
                for (let i of originalImports) {
                    if (i.export) {
                        throw SemanticError("export import not implemented yet: " , i)
                    }
                }
                let others = node.body.filter(node => !ImportDeclaration.is(node))
                let newImports = new Array<ImportDeclaration>()
                for (let declaration of originalImports) {
                    let specifiersArray = new Array<Array<any>>()
                    //  first add all ImportNamespaceSpecifiers to their own sets
                    for (let s of declaration.specifiers) {
                        if (ImportNamespaceSpecifier.is(s)) {
                            specifiersArray.push([s])
                        }
                    }
                    //  then add ImportDefaulSpecifiers to any existing sets
                    for (let s of declaration.specifiers) {
                        if (ImportDefaultSpecifier.is(s)) {
                            let addTo = specifiersArray.find(a => a.length === 1 && ImportNamespaceSpecifier.is(a[0]))
                            if (addTo != null) {
                                addTo.unshift(s)
                            }
                            else {
                                specifiersArray.push([s])
                            }
                        }
                    }
                    //  finally, add all remaining ImportSpecifiers to a set that can contain them.
                    let specifiers = declaration.specifiers.filter(ImportSpecifier.is)
                    if (specifiers.length > 0) {
                        let addTo = specifiersArray.find(a => a.length === 1 && ImportDefaultSpecifier.is(a[0]))
                        if (addTo != null) {
                            addTo.push(...specifiers)
                        }
                        else {
                            specifiersArray.push(specifiers)
                        }
                    }
                    newImports.push(...specifiersArray.map(specifiers => declaration.patch({ specifiers })))
                }
                return node.patch({ body: [...newImports, ...others] })
            }
        }
    })
}
