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
import createConditionalDeclarations from "./createConditionalDeclarations"

export default [
    parsing,
    semanticAnalysis,
    fixImports,
    checkReferences,
    controlFlowToExpressions,
    // createConditionalDeclarations,
    runtimeTypeChecking,
    createRuntime,
    toEsTree,
    codegen,
    writeFiles,
]
