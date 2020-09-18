import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"
import writeFiles from "./writeFiles"
import controlFlowToExpressions from "./controlFlowToExpressions"

export default [
    parsing,
    fixImports,
    controlFlowToExpressions,
    toEsTree,
    codegen,
    writeFiles,
]
