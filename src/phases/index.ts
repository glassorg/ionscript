import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"
import writeFiles from "./writeFiles"
import controlFlowToExpressions from "./controlFlowToExpressions"
import checkReferences from "./checkReferences"
import createRuntime from "./createRuntime"
import runtimeTypeChecking from "./runtimeTypeChecking"

export default [
    parsing,
    fixImports,
    checkReferences,
    controlFlowToExpressions,
    createRuntime,
    runtimeTypeChecking,
    toEsTree,
    codegen,
    writeFiles,
]
