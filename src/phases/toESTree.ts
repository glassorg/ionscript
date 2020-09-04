import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Node, Program } from "../ast"
import Position from "../ast/Position"

export default function toEsTree(root: Map<string, any>, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Position.is(node)) {
                return skip
            }
        },
        merge(node, changes, helper) {
            if (Node.is(node)) {
                return { type: node.constructor.name, ...node, ...changes }
            }
        }
    })
}
