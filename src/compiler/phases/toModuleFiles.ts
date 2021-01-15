import { Options } from "../Compiler";

const babel_options = {
    plugins: [
        [
            require.resolve("@babel/plugin-transform-modules-commonjs"), { noInterop: true }
        ],
        [
            require.resolve("@babel/plugin-proposal-nullish-coalescing-operator")
        ],
        [
            require.resolve("@babel/plugin-proposal-optional-chaining")
        ]
    ]
}

export const moduleExtension = ".mjs"

const isNode = typeof window === "undefined"

export default function toModuleFiles(output, options: Options) {
    let modules = new Map<string,string>()
    for (let path of output.modules.keys()) {
        let modernCode = output.modules.get(path)
        // create the modern modules with import/export syntax
        modules.set(path + moduleExtension, modernCode)
        // create the nodejs compatible modules with require syntax
        if (isNode) {
            let r = require // don't want parcel resolving
            let babel = r("@babel/core")
            let nodejsCode = babel.transform(modernCode, babel_options).code
            modules.set(path + ".js", nodejsCode)
        }
    }
    return { ...output, modules }
}