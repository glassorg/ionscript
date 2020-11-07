import { Options } from "../Compiler";
import * as babel from "@babel/core";

const babel_options = {
    plugins: ["@babel/plugin-transform-modules-commonjs"]
}

export default function toModuleFiles(output, options: Options) {
    let modules = new Map<string,string>()
    for (let path of output.modules.keys()) {
        let modernCode = output.modules.get(path)
        // create the modern modules with import/export syntax
        modules.set(path + ".mjs", modernCode)
        // create the nodejs compatible modules with require syntax
        let nodejsCode = babel.transform(modernCode, babel_options).code
        modules.set(path + ".js", nodejsCode)
    }
    return { ...output, modules }
}