import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Assembly, Node, Typed } from "../ast"
import * as ast from "../ast"
import * as types from "../types"
import createScopeMaps, { ScopeMaps } from "../createScopeMaps"
import getSortedTypedNodes, { getPredecessors } from "../analysis/getSortedTypedNodes"
import evaluate from "../analysis/evaluate"
import { SemanticError } from "../common"

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
    UnaryExpression(node, {resolved}) {
        // for now just use the left type
        let type = unaryOperationsType[node.operator]
        if (type == null) {
            throw SemanticError(`Could not find type for operator: ${node.operator}`, node)
        }
        return { type }
    },
    Literal(node) {
        let jstypeof = typeof node.value
        let type = literalTypes[jstypeof]
        if (type == null) {
            throw SemanticError(`Cannot find type ${jstypeof}`, type)
        }
        return { type }
    },
    // ObjectExpression(node, {resolved, scopeMap, ancestorsMap}) {
    //     let value = new ast.BinaryExpression({
    //         left: new ast.DotExpression({}),
    //         operator: "is",
    //         right: types.Object
    //     })
    //     for (let p of node.properties) {
    //         if (p.key == null) {
    //             throw SemanticError("Key is required", p)
    //         }
    //         let pkey = resolved.get(p.key) ?? p.key
    //         let pvalue = resolved.get(p.value) ?? p.value
    //         // if (pvalue.type == null) {
    //         //     console.log({ pkey, pvalue })
    //         // }
    //         value = new ast.BinaryExpression({
    //             left: value,
    //             operator: "&",
    //             right: new ast.BinaryExpression({
    //                 left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: pkey }),
    //                 operator: "is",
    //                 right: pvalue.type!
    //             })
    //         })
    //     }
    //     let type = new ast.TypeExpression({ value })
    //     return { type }
    // },
    // ConditionalDeclaration(node, {resolved, scopeMap, ancestorsMap}) {
    //     const name = node.id.name
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
    VariableDeclaration(node, {resolved}) {
        if (node.value) {
            let value = resolved.get(node.value)
            return { type: value.type }
        }
    },
    // FunctionExpression(func, {resolved}) {
    //     // traverse and find all return types
    //     let returnTypes: Array<ast.TypeDefinition | ast.Reference> = []
    //     traverse(func.body, {
    //         enter(node) {
    //             if (ast.ReturnStatement.is(node)) {
    //                 let resolvedValue = resolved.get(node.value)
    //                 if (resolvedValue.type == null) {
    //                     throw SemanticError(`Return Value type not resolved`, node)
    //                 }
    //                 if (resolvedValue.type != null) {
    //                     returnTypes.push(resolvedValue.type)
    //                 }
    //                 return skip
    //             }
    //         }
    //     })
    //     let returnType!: ast.Reference | ast.TypeDefinition
    //     if (returnTypes.length > 1) {
    //         let value: ast.Expression | null = null
    //         for (let i = returnTypes.length - 1; i >= 0; i--) {
    //             let type = returnTypes[i]
    //             let newNode: Expression = ast.TypeExpression.is(type)
    //                 ? type.value
    //                 : new ast.BinaryExpression({ left: new ast.DotExpression({}), operator: "is", right: type, location: type.location})
    //             value = value != null ? new ast.BinaryExpression({ left: newNode, operator: "|", right: value }) : newNode
    //         }
    //         returnType = simplify(new ast.TypeExpression({ location: func.body.location, value: value! })) as any
    //     }
    //     else if (returnTypes.length === 0) {
    //         throw SemanticError(`Function returns no value`, func)
    //     }
    //     else if (returnTypes.length === 1) {
    //         returnType = returnTypes[0]
    //     }
    //     // we also need to infer the function signature type
    //     let type = func.type != null ? func.type : new ast.FunctionType({ parameters: func.parameters, returnType })
    //     return { returnType, type }
    // },
    // TypeDeclaration(node) {
    //     return { type: types.Type }
    // },
    // Reference(node, {resolved, scopeMap, ancestorsMap}) {
    //     // if (isAbsoluteName(node.name) && isTypeReference(node)) {
    //     //     return null
    //     // }
    //     let declaration = getDeclaration(node, resolved, scopeMap)
    //     let type = declaration.type!
    //     // Infer in chained conditionals here.
    //     let ancestors = ancestorsMap.get(node)!
    //     // if we are the right side of a A & B conditional then that implies A
    //     type = getChainedConditionalTypeAssertion(ancestors, resolved, type, node, "&", false);
    //     // if we are the right side of a A | B optional then that implies not A
    //     type = getChainedConditionalTypeAssertion(ancestors, resolved, type, node, "|", true);
    //     if (type == null) {
    //         console.error("Reference type not resolved", { declaration })
    //         throw new Error("Reference type not resolved")
    //     }
    //     return { type }
    // },
    // ArrayExpression(node) {
    //     // Type of ArrayExpression
    //     // For now... just Array reference?
    //     // we would need to find the common base type of multiple type expressions or references.
    // },
    // UnaryExpression(node, {resolved, scopeMap}) {
    //     if (node.operator === "typeof") {
    //         if (ast.Reference.is(node.argument) && isAbsolute(node.argument.name)) {
    //             let declaration = getDeclaration(node.argument, resolved, scopeMap)
    //             // typeof just gets the type of a referenced value?
    //             return { type: declaration.type }
    //         }
    //         return { type: types.Type }
    //     }
    //     else {
    //         return { type: node.argument.type }
    //     }
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

export default function inferTypes(root: Assembly, options: Options) {
    let identifiers = new Set<string>()
    let ancestorsMap = new Map<Node, Node>()
    let scopes = createScopeMaps(root, { ancestorsMap, identifiers })
    let resolved = new Map<Typed,Typed>() as Map<Typed,Typed> & Resolved
    let sorted = getSortedTypedNodes(root, scopes, ancestorsMap)
    // let idGenerator = new IdGenerator(identifiers)
    // let newTypeDeclarations = new Map<string, ast.TypeDeclaration>()
    // let typeNameToIdentifierName = new Map<string,string>()
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

    function ensureResolved(originalNode: Typed, resolveDependenciesFirst = false) {
        if (resolved.has(originalNode)) {
            return resolved.get(originalNode)
        }

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
            //         if (ast.TypeDefinition.is(value)) {
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

    // console.log("----- infer types")
    // return traverse(root, {
    //     enter(node, ancestors) {
    //         // TODO: simplify and infer some types.
    //     }
    // })
}
