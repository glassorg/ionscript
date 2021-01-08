import { traverse } from "@glas/traverse";
import { BlockStatement, Literal, Statement } from "../ast";

export default function checkBlockStatements(root) {
    traverse(root, {
        leave(node, ancestors, path) {
            if (BlockStatement.is(node)) {
                for (let s of node.body) {
                    if (!Statement.is(s)) {
                        console.log("PATH: " + path.join(","))
                        throw new Error("This is Bullshit!")
                    }
                }
            }
        }
    })
    return root
}
