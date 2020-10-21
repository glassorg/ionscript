import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Assembly, Node, Typed, Expression } from "../ast"
import * as ast from "../ast"
import * as types from "../types"
import createScopeMaps, { ScopeMaps } from "../createScopeMaps"
import getSortedTypedNodes, { getPredecessors } from "../analysis/getSortedTypedNodes"
import evaluate from "../analysis/evaluate"
import { SemanticError } from "../common"
import simplify from "../analysis/simplify"
import toCodeString from "../toCodeString"
import { getModulePath, isGlobalPath } from "../pathFunctions"
import getLeftMostMemberObject from "../analysis/getLeftMostMemberObject"
import { splitExpressions } from "../analysis/splitExpressions"
import { combineExpressions } from "../analysis/combineExpressions"

type Resolved = { get<T>(t: T): T }

type InferContext = {
    resolved: Resolved,
    scopeMap: ScopeMaps,
    ancestorsMap: Map<Node, Array<any>>,
    originalMap: Resolved,
}

const literalTypes = {
    boolean: types.Boolean,
    number: types.Number,
    object: types.Object,
    string: types.String,
}
const binaryOperationsType = {
    "<": types.Boolean,
    ">": types.Boolean,
    "<=": types.Boolean,
    ">=": types.Boolean,
    "==": types.Boolean,
    "!=": types.Boolean,
    "is": types.Boolean,
    "&&": types.Boolean,
    "&": types.Number,
    "||": types.Boolean,
    "|": types.Number,
    "^": types.Number,
    "+": types.Number,
    "-": types.Number,
    "*": types.Number,
    "**": types.Number,
    "/": types.Number,
    "%": types.Number,
}
const unaryOperationsType = {
    "!": types.Boolean,
    "+": types.Number,
    "-": types.Number,
}

function getDeclarator(node: ast.Reference, resolved: Resolved, scopes: ScopeMaps): ast.Declarator | null {
    node = resolved.get(node) ?? node
    let scope = scopes.get(node) ?? scopes.get(null)
    if (scope == null) {
        console.log("No scope found for ", node)
    }
    let referencedNode = resolved.get(scope[node.name]) ?? scope[node.name]
    if (ast.Declarator.is(referencedNode)) {
        return referencedNode
    }
    else if (ast.Reference.is(referencedNode)) {
        return getDeclarator(referencedNode, resolved, scopes)
    }
    else {
        return null
        // console.error(`Referenced node is not a declaration ${node.name}`, referencedNode)
        // throw new Error("Referenced node is not a declaration")
    }
}

// function getChainedConditionalTypeAssertion(
//     ancestors: Map<Node, Node>,
//     resolved: Resolved,
//     type: ast.Type,
//     node: ast.Reference,
//     operator: string,
//     negate: boolean
// ) {
//     let binaryExpressionIndex = getLastIndex(ancestors, node => ast.BinaryExpression.is(node) && node.operator === operator);
//     if (binaryExpressionIndex >= 0) {
//         let parent = ancestors[binaryExpressionIndex] as ast.BinaryExpression;
//         parent = resolved.get(parent) ?? parent;
//         if (parent.operator === operator) {
//             //  check if we are the right side.
//             //  the parent expression cannot have been resolved yet so we don't have to use resolved.
//             if (parent.right === (ancestors[binaryExpressionIndex + 1] ?? node)) {
//                 // OK, now we just have to check the left side and find a reference with same name.
//                 // we can then definitely assert that the left expression is true
//                 let assertion = parent.left
//                 if (negate) {
//                     assertion = negateExpression(assertion)
//                 }
//                 let result = createCombinedTypeExpression(type, node.name, assertion, node.location!) as any;
//                 // console.log({
//                 //     type: toCodeString(type),
//                 //     parentLeft: toCodeString(parent.left),
//                 //     result: toCodeString(result)
//                 // })
//                 type = result
//             }
//         }
//     }
//     return type;
// }

export const inferType: {
    [P in keyof typeof ast]?: (node: InstanceType<typeof ast[P]>, props: InferContext) => any
} = {
    BinaryExpression(node, {resolved}) {
        // for now just use the left type
        let type = binaryOperationsType[node.operator]
        if (type == null) {
            throw SemanticError(`Could not find type for operator: ${node.operator}`, node)
        }
        return { type }
    },
    UnaryExpression(node, {resolved, scopeMap}) {
        // for now just use the left type
        let type = unaryOperationsType[node.operator]
        if (type == null) {
            throw SemanticError(`Could not find type for operator: ${node.operator}`, node)
        }
        return { type }
    },
    Literal(node) {
        // literals are their own type
        let type = new ast.Literal({ value: node.value })
        return { type }
    },
    ObjectExpression(node, {resolved, scopeMap, ancestorsMap}) {
        let expressions: Array<Expression> = [
            new ast.BinaryExpression({
                left: new ast.DotExpression({}),
                operator: "is",
                right: types.Object
            })
        ]

        for (let p of node.properties) {
            if (ast.Property.is(p)) {
                if (p.key == null) {
                    throw SemanticError("Key is required", p)
                }
                let pkey = resolved.get(p.key) ?? p.key
                let pvalue = resolved.get(p.value) ?? p.value
                if (pvalue.type == null) {
                    console.log({ pkey, pvalue })
                }
                expressions.push(new ast.BinaryExpression({
                    left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: pkey }),
                    operator: "is",
                    right: pvalue.type!
                }))
            }
            else {
                let arg = p.argument
                arg = resolved.get(arg) ?? arg
                if (ast.TypeExpression.is(arg.type)) {
                    for (let e of splitExpressions(arg.type.value, "&&")) {
                        // ignore everything except member expressions
                        console.log("SPREAD: " + toCodeString(e))
                        if (ast.BinaryExpression.is(e) && ast.MemberExpression.is(e.left) && ast.DotExpression.is(getLeftMostMemberObject(e.left))) {
                            let { left } = e
                            // remove any other BinaryExpressions with the same left value
                            expressions = expressions.filter(check => !(ast.BinaryExpression.is(check) && toCodeString(check.left) == toCodeString(left)))
                            // value = combineExpressions()
                            // need ability to override properties in left type
                            expressions.push(e)
                        }
                    }
                }
                else {
                    throw new Error("Unexpected object type: " + toCodeString(arg.type))
                }
            }
        }
        let type = new ast.TypeExpression({ value: combineExpressions(expressions) })
        return { type }
    },
    // ConditionalDeclaration(node, {resolved, scopeMap, ancestorsMap}) {
    //     const name = (node.id as ast.Reference).name
    //     let ancestors = ancestorsMap.get(node)!
    //     let containingIf = getLast(ancestors, ast.IfStatement.is)!
    //     let ancestorDeclaration = resolved.get(getAncestorDeclaration(node, scopeMap, ancestorsMap, ast.IfStatement.is))
    //     let assertion = containingIf.test
    //     if (node.negate) {
    //         assertion = negateExpression(assertion)
    //     }
    //     return { type: createCombinedTypeExpression(ancestorDeclaration.type!, name, assertion, node.location!) }
    // },
    // ClassDeclaration(node, {resolved}) {
    //     // calculate a TypeExpression that can be used to compare these instances
    //     let value: Expression = is(new ast.Reference(node.id))
    //     for (let base of node.baseClasses) {
    //         value = new ast.BinaryExpression({ left: value, operator: "&", right: is(base) })
    //     }
    //     for (let d of node.declarations.values()) {
    //         d = resolved.get(d) ?? d
    //         if (ast.VariableDeclaration.is(d) && d.assignable) {
    //             value = new ast.BinaryExpression({
    //                 left: value,
    //                 operator: "&",
    //                 right: is(d.type!, new ast.MemberExpression({ object: new ast.DotExpression({}), property: d.id }))
    //             })
    //             // if (!d.assignable && d.value != null) {
    //             //     // constant => we can add a specifier that 
    //             //     value = new ast.BinaryExpression({
    //             //         left: value,
    //             //         operator: "==",
    //             //         right: new ast.BinaryExpression({
    //             //             left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: d.id }),
    //             //             operator: "==",
    //             //             right: d.value!
    //             //         })
    //             //     })
    //             // }
    //         }
    //     }
    //     let instanceType = new ast.TypeExpression({ location: node.location, value })
    //     // TODO: Add static properties as well to type
    //     return { instanceType, type: types.Class }
    // },
    Parameter(node, {resolved}) {
        return inferType.VariableDeclaration?.apply(this, arguments as any)
    },
    FunctionExpression(func, {resolved}) {
        // traverse and find all return types
        let returnType = func.returnType
        if (returnType == null) {
            let returnTypes: Array<ast.Type> = []
            traverse(func.body, {
                enter(node) {
                    if (ast.ReturnStatement.is(node)) {
                        let resolvedValue = resolved.get(node.argument)
                        if (resolvedValue.type != null) {
                            returnTypes.push(resolvedValue.type)
                        }
                        else {
                            // throw SemanticError(`Return Value type not resolved`, node)
                            console.log("type not resolved ===>", toCodeString(node.argument))
                            returnTypes.push(types.Any)
                        }
                        return skip
                    }
                }
            })
            //  technically, IF the last statement of (every last branch of) a function
            //  is not a return statement then the function could return void.
            if (returnTypes.length > 1) {
                let value: ast.Expression | null = null
                for (let i = returnTypes.length - 1; i >= 0; i--) {
                    let type = returnTypes[i]
                    let newNode: Expression = ast.TypeExpression.is(type)
                        ? type.value
                        : new ast.BinaryExpression({ left: new ast.DotExpression({}), operator: "is", right: type, location: type.location})
                    value = value != null ? new ast.BinaryExpression({ left: newNode, operator: "|", right: value }) : newNode
                }
                returnType = simplify(new ast.TypeExpression({ location: func.body.location, value: value! })) as any
            }
            else if (returnTypes.length === 0) {
                returnType = types.Void
            }
            else if (returnTypes.length === 1) {
                returnType = returnTypes[0]
            }
        }
        // we also need to infer the function signature type
        let type = func.type != null ? func.type : new ast.FunctionType({ params: func.params.map(p => resolved.get(p)!.type!), returnType })
        return { returnType, type }
    },
    VariableDeclaration(node, {resolved}) {
        if (node.type == null) {
            let value = resolved.get(node.value)
            //  the "type" of a type declaration is the value
            //  otherwise the type is the values type
            console.log("=====VariableDeclaration " + toCodeString(node))
            let type: ast.Type = types.Any
            if (value?.type != null) {
                type = value?.type
            }
            else if (ast.Type.is(value)) {
                type = value
            }
            // console.log("=====VariableDeclaration " + toCodeString(node))
            // let type = node.kind === "type" ? value : (value?.type ?? types.Any)
            // return { type }
        }
    },
    // don't think we need this.
    Declarator(node, {resolved, scopeMap, ancestorsMap}) {
        console.log("=====Declarator " + toCodeString(node))
        let parent = ancestorsMap.get(node)
        parent = resolved.get(parent) ?? parent
        // console.log("????? ", parent?.type)
        // console.log("parent", parent)
        // resolved.get()
        // if (ast.ClassDeclaration.is(parent)) {
        //     throw new Error("Class needs a TYPE")
        //     // return { type: new ast.Reference(parent.id) }
        // }
        if (Typed.is(parent)) {
            return { type: parent.type }
        }
        // throw new Error(`Type not loading Declarator: ${parent?.constructor.name}`)
    },
    // TODO: Working on this.
    Reference(node, {resolved, scopeMap, ancestorsMap}) {
        // if (isAbsoluteName(node.name) && isTypeReference(node)) {
        //     return null
        // }
        let declarator = getDeclarator(node, resolved, scopeMap)
        console.log(declarator)
        let type = declarator?.type ?? types.Any
        // Infer in chained conditionals here.
        // let ancestors = ancestorsMap.get(node)!
        // // if we are the right side of a A & B conditional then that implies A
        // type = getChainedConditionalTypeAssertion(ancestors, resolved, type, node, "&", false);
        // // if we are the right side of a A | B optional then that implies not A
        // type = getChainedConditionalTypeAssertion(ancestors, resolved, type, node, "|", true);
        // if (type == null) {
        //     console.error("Reference type not resolved", { declaration: declarator })
        //     throw new Error("Reference type not resolved")
        // }
        return { type }
    },
    // ArrayExpression(node) {
    //     // Type of ArrayExpression
    //     // For now... just Array reference?
    //     // we would need to find the common base type of multiple type expressions or references.
    // },
    // CallExpression(node, {resolved, scopeMap, ancestorsMap, functionFinder, originalMap}) {
    //     if (ast.Reference.is(node.callee)) {
    //         let declaration = getDeclaration(node.callee, resolved, scopeMap)
    //         if (ast.ClassDeclaration.is(declaration)) {
    //             // IF the callee references a ClassDeclaration,
    //             return { type: node.callee }
    //         }
    //         if (ast.VariableDeclaration.is(declaration) && ast.FunctionExpression.is(declaration.value)) {
    //             let func = resolved.get(declaration.value) ?? declaration.value
    //             return { type: func.returnType }
    //         }
    //     }
    //     let callee = resolved.get(node.callee) ?? node.callee
    //     let calleeType = callee.type
    //     let original = originalMap.get(node) as any
    //     if (ast.MemberExpression.is(original.callee) && ast.Id.is(original.callee.property) && ast.CallExpression.is(callee)) {
    //         // callee WAS a MemberExpression before but now it is a CallExpression. That means UFCS conversion.
    //         // now we have to re-add in our original function arguments.
    //         // callee is a UFCS function reference, so we must convert this call expression.
    //         return node.patch({ callee: callee.callee, arguments: [...callee.arguments, ...node.arguments] })
    //     }

    //     if (!ast.FunctionType.is(calleeType)) {
    //         throw SemanticError("Function expected", node.callee)
    //     }
    //     return { type: calleeType.returnType }
    // },
    // MemberExpression(node, {resolved, scopeMap, ancestorsMap, functionFinder}) {
    //     //  TODO: ClassDeclarations need a proper type, which includes static variables or we fix member ref
    //     //  this node should now have a type
    //     let objectType = getTypeDefinitionOrClassDeclaration(node.object, resolved, scopeMap)
    //     let property = resolved.get(node.property) ?? node.property
    //     // quick lookup if the type is a class reference.
    //     if (ast.ClassDeclaration.is(objectType) && ast.Id.is(property)) {
    //         let declaration = objectType.declarations.get(property.name)
    //         if (declaration != null) {
    //             return { type: declaration.type }
    //         }
    //     }
    //     // convert to type expression for another attempted lookup
    //     let typeExpression = getTypeExpression(objectType)
    //     if (typeExpression == null) {
    //         console.log("SD:LKFJS:DLFKJDS:FLKJD:FLKJ:FDLKJDFL:KJ", { objectType, resolved: resolved.get(objectType) })
    //     }
    //     let type = getMemberTypeExpression(typeExpression, property)
    //     if (type != null) {
    //         return { type }
    //     }
    //     if (ast.Id.is(property)) {
    //         // ufcs lookup baby
    //         let func = functionFinder(typeExpression, property.name)
    //         if (func != null) {
    //             let funcDeclaration = getDeclaration(func, resolved, scopeMap) as ast.VariableDeclaration
    //             let funcValue = funcDeclaration.value as ast.FunctionExpression
    //             funcValue = resolved.get(funcValue) ?? funcValue
    //             // convert this into a function call and add the type
    //             let result = new ast.CallExpression({
    //                 location: node.location,
    //                 callee: func,
    //                 arguments: [
    //                     new ast.Property({ location: node.object.location, value: node.object})
    //                 ],
    //                 type: funcValue.returnType
    //             })
    //             return result
    //         }
    //     }
    //     throw SemanticError(`Member '${toCodeString(property)}' not found on ${toCodeString(objectType)}`, node)
    // },
}

const typeProperties = ["type", "returnType"]

export default function inferTypes(root: Assembly, options: Options) {
    let identifiers = new Set<string>()
    let ancestorsMap = new Map<Node, Node>()
    let scopes = createScopeMaps(root, { ancestorsMap, identifiers })
    let resolved = new Map<Typed,Typed>() as Map<Typed,Typed> & Resolved
    let sorted = getSortedTypedNodes(root, scopes, ancestorsMap)
    // let idGenerator = new IdGenerator(identifiers)
    let newTypeDeclarations = new Map<string, ast.TypeExpression>()
    let typeNameToIdentifierName = new Map<string,string>()
    let originalMap = new Map<Typed,Typed>()
    for (let typed of sorted) {
        originalMap.set(typed, typed)
    }

    function setResolved(originalNode, currentNode) {
        resolved.set(originalNode, currentNode)
        if (originalNode !== currentNode) {
            // make sure that you can still get the correct scope for the new node
            scopes.set(currentNode, scopes.get(originalNode))
            // same for ancestors map
            ancestorsMap.set(currentNode, ancestorsMap.get(originalNode)!)
            // same for originals map
            originalMap.set(currentNode, originalMap.get(originalNode)!)
        }
    }

    let preferredTypeNameToIdentifierName = new Map<string,string>()
    function getSharedTypeReference(node: ast.TypeExpression) {
        let name = toCodeString(node)
        let absoluteName = typeNameToIdentifierName.get(name)
        if (absoluteName == null) {
            let localName = preferredTypeNameToIdentifierName.get(name) ?? "?TYPE:" +name // idGenerator.createNewIdName(name)
            absoluteName = getModulePath("_types", localName)
            typeNameToIdentifierName.set(name, absoluteName)
            // see if we can find sub-nodes within this thingy
            let declaration = new ast.TypeExpression({
                value: traverse(node, {
                    leave(child) {
                        if (child !== node && Node.is(child)) {
                            let code = toCodeString(child)
                            let foundSubexpression = preferredTypeNameToIdentifierName.get(code)
                            if (foundSubexpression) {
                                return new ast.Reference({ name: foundSubexpression })
                            }
                        }
                    }
                })
            })
            newTypeDeclarations.set(absoluteName, declaration)
        }
        return new ast.Reference({ location: node.location, name: absoluteName })
    }

    function ensureResolved(originalNode: Typed, resolveDependenciesFirst = false) {
        if (resolved.has(originalNode)) {
            return resolved.get(originalNode)
        }

        // console.log("------ resolve -> " + toCodeString(originalNode))

        if (resolveDependenciesFirst) {
            for (let pred of getPredecessors(originalNode, scopes, ancestorsMap)) {
                ensureResolved(pred, resolveDependenciesFirst)
            }
        }

        let context = { resolved, scopeMap: scopes, ancestorsMap, originalMap }
        // first try to simplify
        let currentNode = resolved.get(originalNode) as Typed ?? originalNode
        currentNode = evaluate(currentNode, resolved, scopes)
        setResolved(originalNode, currentNode)
        // then try to infer types
        if (currentNode.type == null) {
            let func = inferType[currentNode.constructor.name]
            let changes = func?.(currentNode, context)
            // if (ast.FunctionExpression.is(currentNode)) {
            //     console.log(">>>>>>>>> resolved function: " + toCodeString(currentNode))
            // }
            if (changes != null) {
                if (Typed.is(changes)) {
                    // we track these so they don't get properties merged later but are returned as is.
                    customConvertedNodes.add(changes)
                    currentNode = changes
                }
                else {
                    currentNode = currentNode.patch(changes)
                }
            }
            setResolved(originalNode, currentNode)
        }
        // if (ast.Declaration.is(currentNode) && isAbsolute(currentNode.id.name)) {
        //     let name = currentNode.id.name
        //     let code = toCodeString(currentNode.type!)
        //     if (!ast.Reference.is(currentNode.type) && name.length < code.length) {
        //         preferredTypeNameToIdentifierName.set(code, `typeof ${sanitize(name)}`)
        //     }
        // }
        return currentNode
    }
    // in order of preference: absolute path declaration... that's it.
    // we iterate all of the typed nodes in dependency order and resolve their actual types
    let customConvertedNodes = new Set<Typed>()
    for (let originalNode of sorted) {
        ensureResolved(originalNode)
    }
    // console.log(preferredTypeNameToIdentifierName)

    return traverse(root, {
        enter(node) {
            if (ast.Location.is(node)) {
                return skip
            }
        },
        merge(node, changes, helper) {
            let result = resolved.get(node)
            if (customConvertedNodes.has(result)) {
                return result
            }
            // if (result) {
            //     for (let name of typeProperties) {
            //         let value = result[name]
            //         if (ast.TypeExpression.is(value)) {
            //             // move to a shared location and replace with a reference.
            //             result = result!.patch({ [name]: getSharedTypeReference(value) })
            //         }
            //     }
            // }
            if (result) {
                return Node.is(changes) ? changes : helper.patch(result, changes)
            }
        }
    })

    // add the types...

    // console.log("----- infer types")
    // return traverse(root, {
    //     enter(node, ancestors) {
    //         // TODO: simplify and infer some types.
    //     }
    // })
}
