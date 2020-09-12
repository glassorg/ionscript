import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"
import writeFiles from "./writeFiles"

export default [
    parsing,
    fixImports,
    toEsTree,
    codegen,
    writeFiles,
]
