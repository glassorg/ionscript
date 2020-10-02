import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"
import writeFiles from "./writeFiles"
import controlFlowToExpressions from "./controlFlowToExpressions"
import checkReferences from "./checkReferences"
import createRuntime from "./createRuntime"
import classPropertyTypeChecking from "./classPropertyTypeChecking"

export default [
    parsing,
    fixImports,
    checkReferences,
    controlFlowToExpressions,
    classPropertyTypeChecking,
    createRuntime,
    toEsTree,
    codegen,
    writeFiles,
]
