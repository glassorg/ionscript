import { IfStatement, BlockStatement, Reference, ConditionalDeclaration, Assembly, Declarator, ReturnStatement, ThrowStatement } from "../ast";
import { traverse } from "@glas/traverse";
import { getNodesOfType } from "../common";

export default function createConditionalDeclarations(root: Assembly) {
    // first we need to find any IfStatements with consequent returns or throws that don't have a
    root = traverse(root, {
        leave(node, ancestors) {
            if (BlockStatement.is(node)) {
                let { body } = node
                for (let i = body.length - 1; i >= 0; i--) {
                    let statement = body[i]
                    if (IfStatement.is(statement) && statement.alternate == null) {
                        let last = statement.consequent.body[statement.consequent.body.length - 1]
                        if (ReturnStatement.is(last) || ThrowStatement.is(last)) {
                            // we need to add everything that follows as implied
                            let remainder = body.slice(i + 1)
                            if (remainder.length > 0) {
                                body = [
                                    ...body.slice(0, i),
                                    statement.patch({
                                        alternate: new BlockStatement({
                                            location: statement.location,
                                            body: remainder
                                        })
                                    })
                                ]
                            }
                        }
                    }
                }
                if (body !== node.body) {
                    return node.patch({ body })
                }
            }
        }
    })

    return traverse(root, {
        enter(node) {
        },
        leave(node, ancestors) {
            if (IfStatement.is(node) && node.consequent.body.length > 0) {
                //  find all unique named references
                //  create a new ConditionalDeclaration for each, replacing named refs with DotExpression
                // find all variable declaration references
                let refs = new Set(getNodesOfType(node.test, Reference.is).map(n => n.name) /*.filter(isLowerCase) */)
                // now we have to redeclare more strongly typed stuff.
                let newConsequents = new Array<ConditionalDeclaration>()
                let newAlternates = node.alternate != null ? new Array<ConditionalDeclaration>() : null
                for (let name of refs) {
                    let { location } = node.test
                    newConsequents.push(new ConditionalDeclaration({
                        kind: "conditional",
                        location,
                        id: new Declarator({ name, location })
                    }))
                    if (newAlternates) {
                        newAlternates.push(new ConditionalDeclaration({
                            kind: "conditional",
                            negate: true,
                            location,
                            id: new Declarator({ name, location })
                        }))
                    }
                }
                let { location } = node
                let consequent = new BlockStatement({ location, body: [...newConsequents, ...node.consequent.body] })
                let alternate = node.alternate
                if (IfStatement.is(alternate)) {
                    //  we must convert ifs to block statements so our scoped variable
                    //  won't interfere with it scoping the same named variable.
                    alternate = new BlockStatement({
                        location,
                        body: [alternate]
                    })
                }
                if (BlockStatement.is(alternate)) {
                    alternate = alternate.patch({
                        location,
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
