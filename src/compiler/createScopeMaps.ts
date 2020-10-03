import { traverse, skip } from "@glas/traverse"
import { SemanticError } from "./common"
import { Node, FunctionExpression, Scope, Identifier, Reference, Declaration, VariableDeclaration, Declarator, Pattern, Parameter } from "./ast"

export type NodeMap<T> = {
    get(global: null): T
    get(node: Node): T
    set(node: Node, t: T)
}

export type ScopeMap = { [id: string]: Declarator }
export type ScopeMaps = NodeMap<ScopeMap>

/**
 * Returns a Map which will contain a scope object with variable names returning Declarations.
 * scopes.get(null) will return the global scope
 * @param root the ast
 */
export default function createScopeMaps(
    root,
    options: {
        checkDeclareBeforeUse?: boolean,
        identifiers?: Set<String>,
        ancestorsMap?: Map<Node, Array<any>>,
        pathMap?: Map<Node, Array<String>>,
    } = {}
): ScopeMaps {
    let {
        checkDeclareBeforeUse,
        identifiers = new Set<String>(),
        ancestorsMap,
        pathMap
    } = options

    let map = new Map()
    let global = {
        // // always add "." to the global namespace so TypeExpressions don't complain
        // ".": new VariableDeclaration({ id: new Identifier({ name: "." }), kind: "const" })
    }
    let scopes: object[] = [global]
    map.set(null, global)

    function declare(node: Declarator) {
        identifiers.add(node.name)
        let scope: any = scopes[scopes.length - 1]
        scope[node.name as any] = node
    }

    function declarePattern(node: Pattern) {
        if (Declarator.is(node)) {
            declare(node)
        }
        else {
            traverse(node, {
                enter(node) {
                    if (Declarator.is(node)) {
                        declare(node)
                        return skip
                    }
                }
            })
        }
    }

    traverse(root, {
        enter(node, ancestors, path) {
            //  do nothing on Parameters, they're handled by their containing functions
            if (Parameter.is(node)) {
                return
            }
            //  get the current scope
            let scope = scopes[scopes.length - 1]
            //  save a map from this nodes location to it's scope
            map.set(node, scope)
            if (ancestorsMap) {
                ancestorsMap.set(node, ancestors.slice(0))
            }
            if (pathMap) {
                pathMap.set(node, path.slice(0))
            }
            function pushScope() {
                scopes.push(scope = { __proto__: scope, __source: node.constructor.name + " => " + JSON.stringify(node.location ?? "NULL") })
            }

            //  if this node is a scope then we push a new scope
            if (Scope.is(node)) {
                pushScope()
                // console.log('++++')
            }

            //  let's check that referenced identifiers are in scope
            if (checkDeclareBeforeUse && Reference.is(node)) {
                let declaration = scope[node.name]
                if (declaration == null) {
                    throw SemanticError(`Cannot use variable '${node.name}' before declaration.`, node.location)
                }
            }

            //  declarations set themselves in scope
            if (Pattern.is(node)) {
                declarePattern(node)
            }

            //  functions set their parameters in scope
            if (FunctionExpression.is(node)) {
                for (let parameter of node.params) {
                    declarePattern(parameter.id)
                }
            }
        },
        leave(node) {
            if (Scope.is(node)) {
                // console.log('----')
                scopes.pop()
            }
        }
    })

    return map
}