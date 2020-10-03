import { Analysis, IfStatement, BinaryExpression, BlockStatement, Expression, Reference, VariableDeclaration, ConditionalDeclaration, DotExpression, Identifier, Assembly, Declarator } from "../ast";
import { traverse, skip } from "@glas/traverse";
import { getNodesOfType } from "../common";
// import { conditionalChainToBinaryExpression } from "./createConditionalChains";

export default function createConditionalDeclarations(root: Assembly) {
    return traverse(root, {
        enter(node) {
        },
        leave(node) {
            if (IfStatement.is(node) && node.consequent.body.length > 0) {
                //  find all unique named references
                //  create a new ConditionalDeclaration for each, replacing named refs with DotExpression
                // find all variable declaration references
                let refs = new Set(getNodesOfType(node.test, Reference.is).map(n => n.name) /*.filter(isLowerCase) */)
                // now we have to redeclare more strongly typed stuff.
                let newConsequents = new Array<ConditionalDeclaration>()
                let newAlternates = node.alternate != null ? new Array<ConditionalDeclaration>() : null
                for (let name of refs) {
                    newConsequents.push(new ConditionalDeclaration({
                        kind: "conditional",
                        location: node.test.location,
                        id: new Declarator({ name })
                    }))
                    if (newAlternates) {
                        newAlternates.push(new ConditionalDeclaration({
                            kind: "conditional",
                            negate: true,
                            location: node.test.location,
                            id: new Declarator({ name })
                        }))
                    }
                }
                let consequent = new BlockStatement({ body: [...newConsequents, ...node.consequent.body] })
                let alternate = node.alternate
                if (IfStatement.is(alternate)) {
                    //  we must convert ifs to block statements so our scoped variable
                    //  won't interfere with it scoping the same named variable.
                    alternate = new BlockStatement({
                        body: [alternate]
                    })
                }
                if (BlockStatement.is(alternate)) {
                    alternate = alternate.patch({
                        body: [...newAlternates!, ...alternate.body]
                    })
                }
                return node.patch({
                    consequent,
                    alternate,
                })
            }
        }
    })
}
