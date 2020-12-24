import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import escodegen from "escodegen"

export default function codegen(root, options: Options) {
    return traverse(root, {
        enter(node) {
            if (node.type === "Program") {
                return skip
            }
        },
        leave(node) {
            if (node.type === "Program") {
                return escodegen.generate(node)
            }
        }
    })
}
