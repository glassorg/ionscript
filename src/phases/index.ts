import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"
import writeFiles from "./writeFiles"
import controlFlowToExpressions from "./controlFlowToExpressions"
import checkReferences from "./checkReferences"

export default [
    parsing,
    fixImports,
    // checkReferences,
    controlFlowToExpressions,
    toEsTree,
    codegen,
    writeFiles,
]
