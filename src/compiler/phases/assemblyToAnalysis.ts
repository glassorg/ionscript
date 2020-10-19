import Assembly from "../ast/Assembly";
import { Options } from "../Compiler";
import Analysis from "../ast/Analysis";
import Declaration from "../ast/Declaration";

export default function assemblyToAnalysis(root: Assembly, options: Options): Analysis {

    //  Then we extract all declarations out
    let declarations = new Map<string, Declaration>()
    for (let moduleName of root.modules.keys()) {
        let module = root.modules.get(moduleName)!
        // move all declarations into the assembly declarations
        for (let statement of module.body) {
            let declaration = statement as Declaration
            // let exportName = pathFunctions.getPath(moduleName, declaration.id.name)
            // declarations.set(
            //     exportName,
            //     declaration.patch({
            //         id: declaration.id.patch({
            //             name: exportName
            //         })
            //     })
            // )
        }
    }

    //  And finally create the new Analysis scope
    return new Analysis({ declarations })
}

/*

//  for analysis... we need every reference that can be to be an absolute reference
//  a ScopeMap can be used to locate references

We have to convert all declarations into single declarations.
ImportDeclaration
    ImportNamespaceSpecifier *
    ImportDefaultSpecifier *
    ImportSpecifier *
VariableDeclaration
    VariableDeclarator +

//  We just have to remove all imports and convert any references to imports into absolute references.
//  We want to do that anyways, so that we can remove direct external references and use module.export style member expressions.
//  That makes circular dependency import errors less likely.
//  So next step:
//  TODO TONIGHT:
//      Implement createScopeMap
//      Find references to imported declarations
//      Replace them with absolute references

*/