import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"
import writeFiles from "./writeFiles"
import controlFlowToExpressions from "./controlFlowToExpressions"
import checkReferences from "./checkReferences"
import createRuntime from "./createRuntime"
import runtimeTypeChecking from "./runtimeTypeChecking"
import semanticAnalysis from "./semanticAnalysis"
// import inheritBaseClasses from "./inheritBaseClasses"
import addDataClassConstructors from "./addDataClassConstructors"
import addTypedStructArrays from "./addTypedStructArrays"
import toModuleFiles from "./toModuleFiles"
import identity from "./identity"
import copyResources from "./copyResources"

export const fast = [
    parsing,
    controlFlowToExpressions,
    addTypedStructArrays,
    runtimeTypeChecking,
    createRuntime,
    toEsTree,
    codegen,
    toModuleFiles,
    writeFiles,
]

const defaultPhases = [
    parsing,
    semanticAnalysis,
    fixImports,
    // inheritBaseClasses,
    controlFlowToExpressions,
    checkReferences, // probably leave this here.
    // createConditionalDeclarations,
    addDataClassConstructors,
    // inferTypes,

    addTypedStructArrays,

    // we could skip this
    runtimeTypeChecking,
    createRuntime,
    toEsTree,
    identity,
    codegen,
    toModuleFiles,
    // now load resources
    copyResources,

    // no emit
    writeFiles,
]

export default defaultPhases

// we remove the last 6 phases if we're not emitting.
export const noEmit = defaultPhases.slice(0, -1);
