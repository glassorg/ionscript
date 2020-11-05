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
import inheritBaseClasses from "./inheritBaseClasses"
import createConditionalDeclarations from "./createConditionalDeclarations"
import inferTypes from "./inferTypes"
import addDataClassConstructors from "./addDataClassConstructors"
import addTypedStructArrays from "./addTypedStructArrays"

export default [
    parsing,
    semanticAnalysis,
    fixImports,
    inheritBaseClasses,
    controlFlowToExpressions,
    createConditionalDeclarations,
    addDataClassConstructors,
    checkReferences,
    inferTypes,

    addTypedStructArrays,
    runtimeTypeChecking,
    createRuntime,
    toEsTree,
    codegen,
    writeFiles,
]
