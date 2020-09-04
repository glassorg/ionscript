import parsing from "./parsing"
import codegen from "./codegen"
import toEsTree from "./toEsTree"
import fixImports from "./fixImports"

export default [
    parsing,
    fixImports,
    toEsTree,
    codegen,
]
