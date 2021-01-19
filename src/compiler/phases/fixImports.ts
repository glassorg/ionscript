import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import { ClassDeclaration, Declarator, ExportNamedDeclaration, ExportSpecifier, Identifier, ModuleSpecifier, Position, Program, Reference, Statement, VariableDeclaration } from "../ast"
import ImportDeclaration from "../ast/ImportDeclaration"
import ImportNamespaceSpecifier from "../ast/ImportNamespaceSpecifier"
import ImportDefaultSpecifier from "../ast/ImportDefaultSpecifier"
import ImportSpecifier from "../ast/ImportSpecifier"
import { SemanticError } from "../common"
import Assembly from "../ast/Assembly"

function toImportSpecifier(m: ModuleSpecifier) {
    if (ImportDeclaration.is(m)) {
        debugger
    }
    return m.local.name === "default" ? m.patch({local:m.local.patch({ name: "_default" })}) : m
}

function toExportSpecifier(m: ExportSpecifier) {
    return m.local.name === "_default" ? m.patch({exported:m.exported.patch({ name: "default" })}) : m
}

// function extractNestedImports(node: ImportDeclaration) {
//     let children = new Array<ImportDeclaration>()
//     for (let specifier of node.specifiers) {
//         if (ImportDeclaration.is(specifier)) {

//         }
//         specifier.
//     }
//     //  first extract children
//     // 
// }

export default function fixImports(root: Assembly, options: Options) {
    // first extract nested ImportDeclarations into their own declarations.
    root = traverse(root, {
        enter(node) {
            if ((!ImportDeclaration.is(node) && Statement.is(node)) || Position.is(node)) {
                return skip
            }
        },
        leave(node, ancestors) {
            if (ImportDeclaration.is(node)) {
                let subDeclarations = node.specifiers.filter(ImportDeclaration.is) as any as ImportDeclaration[]
                if (subDeclarations.length > 0) {
                    let newSpecifiers = node.specifiers.filter(d => !ImportDeclaration.is(d))
                    let newDeclarations = new Array<ImportDeclaration>()
                    for (let subDeclaration of subDeclarations) {
                        if (subDeclaration.path?.[0] as any !== ".") {
                            throw SemanticError("Nested imports must begin with a single .", subDeclaration)
                        }
                        let newPath = [...node.path!, ...(subDeclaration.path as any).slice(1)]
                        let newSource = subDeclaration.source.patch({ value: newPath.map(id => id.name || id).join("/") })
                        newDeclarations.push(subDeclaration.patch({
                            path: newPath,
                            source: newSource
                        }))
                    }
                    // only retain the parent import IF it still has explicit specifiers
                    if (newSpecifiers.length > 0) {
                        newDeclarations.unshift(node.patch({ specifiers: newSpecifiers }))
                    }
                    return replace(...newDeclarations)
                }
            }
        }
    })
    //  then fix the remaining stand alone import declarations.
    return traverse(root, {
        enter(node) {
            if (Program.is(node)) {
                return skip
            }
        },
        leave(node) {
            // refactor default class exports to be a stand alone declaration and a default export let declaration
            if (Program.is(node)) {
                let originalImports = node.body.filter(node => ImportDeclaration.is(node)) as ImportDeclaration[]
                let exports = new Array<Declarator>()
                let others = node.body.filter(node => !ImportDeclaration.is(node))
                //  start with all imports that have no specifiers (for side-effects only)
                let newImports = originalImports.filter(i => i.specifiers.length === 0)
                for (let declaration of originalImports) {
                    let declarationSpecifiers = (declaration.specifiers as ModuleSpecifier[]).map(toImportSpecifier)
                    if (declaration.export) {
                        exports.push(...declarationSpecifiers.map(s => s.local))
                    }
                    let specifiersArray = new Array<Array<any>>()
                    //  first add all ImportNamespaceSpecifiers to their own sets
                    for (let s of declarationSpecifiers) {
                        if (ImportNamespaceSpecifier.is(s)) {
                            specifiersArray.push([s])
                        }
                    }
                    //  then add ImportDefaulSpecifiers to any existing sets
                    for (let s of declarationSpecifiers) {
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
                    let specifiers = declarationSpecifiers.filter(ImportSpecifier.is)
                    if (specifiers.length > 0) {
                        let addTo = specifiersArray.find(a => a.length === 1 && ImportDefaultSpecifier.is(a[0]))
                        if (addTo != null) {
                            addTo.push(...specifiers)
                        }
                        else {
                            specifiersArray.push(specifiers)
                        }
                    }
                    newImports.push(...specifiersArray.map(specifiers => declaration.patch({ specifiers, export: 0 })))
                }
                let newExports = exports.length === 0 ? [] : [ new ExportNamedDeclaration({
                    specifiers: exports.map(d => toExportSpecifier(new ExportSpecifier({
                        location: d.location,
                        local: new Declarator(d),
                        exported: new Declarator(d),
                    })))
                })]
                return node.patch({ body: [...newImports, ...newExports, ...others] })
            }
        }
    })
}
