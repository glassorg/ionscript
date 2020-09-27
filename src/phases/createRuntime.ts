import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import Assembly from "../ast/Assembly"
import { BlockStatement, ClassDeclaration, FunctionExpression, ReturnStatement, VariableDeclaration } from "../ast"

export default function createRuntime(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            // if (ClassDeclaration.is(node)) {
            //     return skip
            // }
        },
        leave(node, ancestors, path) {
            // 
            if (VariableDeclaration.is(node) && !FunctionExpression.is(node.value)) {
                if (node.static || node.instance) {
                    if (node.kind === "let" && node.value != null) {
                        return node.patch({
                            kind: "get",
                            value: new FunctionExpression({
                                params: [],
                                body: new BlockStatement({
                                    body: [
                                        new ReturnStatement({ argument: node.value })
                                    ]
                                })
                            })
                        })
                    }
                }
            }
        }
    })
}
