import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Assembly, Node, Typed, Expression } from "../ast"
import * as ast from "../ast"
import * as types from "../types"
import createScopeMaps, { ScopeMaps } from "../createScopeMaps"
import getSortedTypedNodes, { getContainingIfTestAndOriginalDeclarator, getPredecessors } from "../analysis/getSortedTypedNodes"
import evaluate from "../analysis/evaluate"
import { getAncestor, getAncestorsAndSelfList, getOriginalDeclaration, getOriginalDeclarator, SemanticError } from "../common"
import simplify from "../analysis/simplify"
import toCodeString from "../toCodeString"
import { getModulePath, isGlobalPath } from "../pathFunctions"
import getLeftMostMemberObject from "../analysis/getLeftMostMemberObject"
import splitExpressions from "../analysis/splitExpressions"
import combineExpressions from "../analysis/combineExpressions"
import getMemberTypeExpression from "../analysis/getMemberTypeExpression"
import getFinalStatements from "../analysis/getFinalStatements"
import and, { simplifyType } from "../analysis/combineTypeExpression"
import negate from "../analysis/negate"

type Resolved = { get<T>(t: T): T }

type InferContext = {
    resolved: Resolved,
    scopeMap: ScopeMaps,
    ancestorsMap: Map<Node, Node>,
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

function is(type: ast.Type, left: Expression = new ast.DotExpression({})) {
    return new ast.BinaryExpression({
        location: type.location,
        left,
        operator: "is",
        right: type
    })
}

function getImpliedType(type: ast.Type | null, assertion: ast.Expression, name: string): ast.Type | null {
    type = toTypeExpression(type)
    let found = 0
    let assertType = assertion == null ? null :traverse(assertion, {
        leave(node) {
            if (ast.Reference.is(node) && node.name === name) {
                found++
                return new ast.DotExpression({})
            }
        }
    })
    // didn't find any means the expression was irrelevant to the type so we can ignore it
    if (found > 0) {
        type = and(type, assertType)!
    }
    type = simplifyType(type)
    return type
}

/**
 * Returns any Type object other than References which it will traverse.
 */
function getType(node: ast.Type | null, resolved: Resolved, scopes: ScopeMaps): ast.Type | null {
    if (ast.Reference.is(node)) {
        let declarator = getDeclarator(node, resolved, scopes)
        if (declarator != null) {
            return getType(declarator.type, resolved, scopes)
        }
    }
    if (ast.Type.is(node)) {
        return node
    }
    return null
}

function getClassDeclaration(node: ast.Reference, resolved: Resolved, scopes: ScopeMaps, ancestors: Map<Node,Node>) {
    let declarator = getDeclarator(node, resolved, scopes)
    if (declarator) {
        let baseDeclaration = ancestors.get(declarator)
        baseDeclaration = resolved.get(baseDeclaration) ?? baseDeclaration
        if (ast.ClassDeclaration.is(baseDeclaration)) {
            return baseDeclaration
        }
    }
    return null
}

function getFunctionType(node: ast.Type, resolved: Resolved, scopes: ScopeMaps) {
    let type = getType(node, resolved, scopes)
    if (ast.FunctionType.is(type)) {
        return type
    }
    if (ast.TypeExpression.is(type)) {
        // look inside and see if it implements a FunctionType
        for (let e of splitExpressions(type.value)) {
            if (ast.BinaryExpression.is(e)
                && e.operator === "is"
                && ast.DotExpression.is(e.left)
                && ast.FunctionType.is(e.right)
            ) {
                return e.right
            }
        }
    }
    return null
}

function getConstructorType(node: ast.ClassDeclaration, resolved: Resolved, scopes: ScopeMaps, ancestors: Map<Node,Node>, returnType: ast.Reference | null = null) : ast.FunctionType | null {
    // if (node.isData) {
    //     console.log("------ not implemented data constructor types")
    //     // crap... we cannot actually
    //     // throw new Error("Not implemented data class constructor types")
    // }
    //  returnType is null on the first call, recursive calls pass in the original class type
    //  which should be the returnType patched onto any inherited constructor
    //  constructors can be inherited from base classes when not specified in subclasses
    let returnDefault = returnType == null
    if (returnType == null) {
        returnType = new ast.Reference({ name: node.id.path! })
    }
    let ctor = node.instance.declarations.find(d => ast.VariableDeclaration.is(d) && (d.id as ast.Declarator).name === "constructor")
    if (ctor == null) {
        for (let base of node.baseClasses) {
            let baseDeclaration = getClassDeclaration(base, resolved, scopes, ancestors)
            if (baseDeclaration != null) {
                let baseType = getConstructorType(baseDeclaration, resolved, scopes, ancestors, returnType)
                if (baseType != null) {
                    return baseType.patch({ returnType })
                }
            }
        }
    }
    else {
        // return the type of the ctor.
        let { value } = ctor
        value = resolved.get(value) ?? value
        if (value != null && ast.FunctionType.is(value?.type)) {
            return value.type
        }
    }

    // default constructor
    return returnDefault ? new ast.FunctionType({
        params: [],
        returnType: new ast.Reference({ name: node.id.path! })
    }) : null
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

function getChainedConditionalTypeAssertion(
    ancestorsMap: Map<Node, Node>,
    resolved: Resolved,
    type: ast.Type | null,
    node: ast.Reference,
    operator: "&&" | "||" | "?",
    negateValue?: boolean
) {
    let alist = getAncestorsAndSelfList(node, ancestorsMap)
    let expressionIndex = alist.findIndex(node =>  {
        if (operator === "?") {
            return ast.ConditionalExpression.is(node)
        }
        return ast.BinaryExpression.is(node) && node.operator === operator
    })
    if (expressionIndex >= 0) {
        let parent = alist[expressionIndex];
        parent = resolved.get(parent) ?? parent;
        if (ast.BinaryExpression.is(parent)) {
            //  check if we are the right side.
            //  the parent expression cannot have been resolved yet so we don't have to use resolved.
            if (parent.right === alist[expressionIndex - 1]) {
                // OK, now we just have to check the left side and find a reference with same name.
                // we can then definitely assert that the left expression is true
                let assertion = parent.left
                if (negateValue) {
                    assertion = negate(assertion)
                }
                return getImpliedType(type, assertion, node.name)
            }
        }
        else if (ast.ConditionalExpression.is(parent)) {
            let isConsequent = parent.consequent === alist[expressionIndex - 1]
            let isAlternate = parent.alternate === alist[expressionIndex - 1]
            // type is only implied if we are in the consequent or alternate path
            //  otherwise we are in the test which implies nothing
            if (isConsequent || isAlternate) {
                let assertion = parent.test
                if (isAlternate) {
                    assertion = negate(assertion)
                }
                return getImpliedType(type, assertion, node.name)
            }
        }
    }
    return type;
}

function toTypeExpression(type: ast.Type | null): ast.TypeExpression | null {
    if (ast.TypeExpression.is(type)) {
        return type
    }
    if (ast.Reference.is(type)) {
        return new ast.TypeExpression({
            value: new ast.BinaryExpression({
                left: new ast.DotExpression({}),
                operator: "is",
                right: type
            })
        })
    }
    return null
    // throw new Error("getTypeExpression not implemented for " + type.constructor.name)
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
    ArrayExpression(node, {resolved, scopeMap, ancestorsMap}) {
        let expressions: Array<Expression> = [
            new ast.BinaryExpression({
                left: new ast.DotExpression({}),
                operator: "is",
                right: types.Array
            })
        ]

        let length = 0
        let lengthKnown = true
        let index = 0
        for (let p of node.elements) {
            p = resolved.get(p) ?? p
            if (ast.Expression.is(p)) {
                length++
                expressions.push(new ast.BinaryExpression({
                    left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: new ast.Literal({ value: index }) }),
                    operator: "is",
                    right: p.type!
                }))
            }
            else if (ast.SpreadElement.is(p)) {
                let arg = p.argument
                arg = resolved.get(arg) ?? arg
                let argType = getType(arg.type, resolved, scopeMap)
                if (ast.TypeExpression.is(argType)) {
                    let foundLength = false
                    let baseLength = length // save length before we add so we can offset indices
                    for (let e of splitExpressions(argType.value)) {
                        // ignore everything except member expressions
                        if (ast.BinaryExpression.is(e)
                            && ast.MemberExpression.is(e.left)
                            && ast.DotExpression.is(e.left.object)
                        ) {
                            if (ast.Identifier.is(e.left.property)
                                && e.left.property.name === "length"
                                && ast.Literal.is(e.right)
                                && typeof e.right.value === "number"
                            ) {
                                if (e.operator === "==" || e.operator == ">=") {
                                    if (e.operator === "==") {
                                        foundLength = true
                                    }
                                    length += e.right.value
                                }
                            }
                            //  if length is not known for sure, then we cannot assert index types
                            //  theoretically... we COULD assert offset from right end of array
                            if (lengthKnown && e.operator === "is" && ast.Literal.is(e.left.property) && typeof e.left.property.value === "number") {
                                let { left } = e
                                // remove any other BinaryExpressions with the same left value
                                // expressions = expressions.filter(check => !(ast.BinaryExpression.is(check) && toCodeString(check.left) == toCodeString(left)))
                                // value = combineExpressions()
                                // need ability to override properties in left type
                                let newIndex = baseLength + e.left.property.value
                                // the length must be at least large enough to hold this new index
                                length = Math.max(length, newIndex + 1)
                                expressions.push(e.patch({
                                    left: e.left.patch({
                                        property: new ast.Literal({
                                            value: newIndex
                                        })
                                    })
                                }))
                            }
                        }
                    }
                    if (!foundLength) {
                        lengthKnown = false
                    }
                }
                else {
                    console.log("ArrayExpression: Unexpected object type: " + toCodeString(arg.type))
                }
            }
            index++
        }
        //  finally, insert a length property as a minimally known value
        //  if there are spread elements it could be larger
        expressions.splice(1, 0, new ast.BinaryExpression({
            left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: new ast.Identifier({ name: "length" }) }),
            operator: lengthKnown ? "==" : ">=",
            right: new ast.Literal({ value: length })
        }))
        let type = new ast.TypeExpression({ value: combineExpressions(expressions) })
        return { type }
        // Type of ArrayExpression
        // For now... just Array reference?
        // we would need to find the common base type of multiple type expressions or references.
        return { type: types.Array }
    },
    ConditionalDeclaration(node, {resolved, scopeMap, ancestorsMap}) {
        const name = (node.id as ast.Reference).name
        let [newKnownType, containingVarDeclarator] = getContainingIfTestAndOriginalDeclarator(node, scopeMap, ancestorsMap)
        newKnownType = resolved.get(newKnownType) ?? newKnownType!
        containingVarDeclarator = resolved.get(containingVarDeclarator) ?? containingVarDeclarator!
        // console.log(' ===> ' + name, containingVarDeclarator, " parent: " + ancestorsMap.get(containingVarDeclarator)?.constructor.name)
        // console.log(' should have a type: ' + toCodeString(containingVarDeclarator?.type))
        if (node.negate) {
            newKnownType = negate(newKnownType)
        }
        let type = getImpliedType(containingVarDeclarator?.type, newKnownType, name)
        return { type }
    },
    ClassDeclaration(node, {resolved, ancestorsMap, scopeMap}) {
        // calculate a TypeExpression that can be used to compare these instances
        let instanceExpressions = new Array<Expression>()
        instanceExpressions.push(is(new ast.Reference({ name: node.id.path! })))
        // with normal (non-data) classes, we should combine actual instanceType from class 
        for (let base of node.baseClasses) {
            if (!node.isData) {
                let baseDeclaration = getClassDeclaration(base, resolved, scopeMap, ancestorsMap)
                if (baseDeclaration != null) {
                    instanceExpressions.push(baseDeclaration.instanceType!)
                    // SKIP adding the reference is check beneath since this already contains it
                    continue
                }
            }
            instanceExpressions.push(is(base))
        }
        function *getAssertions(declarations: Iterable<ast.Declaration>) {
            for (let d of declarations) {
                d = resolved.get(d) ?? d
                if (ast.VariableDeclaration.is(d)) {
                    switch (d.kind) {
                        case "var":
                            yield is(d.type!, new ast.MemberExpression({ object: new ast.DotExpression({}), property: d.id }))
                            break;
                        case "let":
                            yield new ast.BinaryExpression({
                                left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: d.id }),
                                operator: "==",
                                right: d.value!
                            })
                            break;
                    }
                }
            }
        }
        instanceExpressions.push(...getAssertions(node.instance.declarations))
        let instanceType = new ast.TypeExpression({ location: node.location, value: combineExpressions(instanceExpressions) })

        // infer static types
        let type = new ast.TypeExpression({
            location: node.location,
            value: combineExpressions([
                is(getConstructorType(node, resolved, scopeMap, ancestorsMap)!),
                is(types.Class),
                is(types.Function),
                ...getAssertions(node.static)
            ])
        })

        // console.log(">>>>> instance " + toCodeString(instanceType))
        // console.log("<<<<< static   " + toCodeString(type))
        return { instanceType, type }
    },
    Parameter(node, {resolved}) {
        return inferType.VariableDeclaration?.apply(this, arguments as any)
    },
    FunctionExpression(func, {resolved, ancestorsMap}) {
        // traverse and find all return types
        let returnType = func.returnType
        if (returnType == null) {
            // see if we are a constructor...
            if (func.id?.name === "constructor") {
                let parent = ancestorsMap.get(func)
                if (ast.VariableDeclaration.is(parent) && parent.instance) {
                    let clas = getAncestor(parent, ancestorsMap, ast.ClassDeclaration.is)
                    // returnType is the containing class
                    if (clas) {
                        returnType = new ast.Reference({ name: clas?.id.path! })
                    }
                }
            }
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
                let finalStatements = [...getFinalStatements(func.body)]
                if (finalStatements.find(s => !ast.ReturnStatement.is(s)) != null) {
                    returnTypes.push(types.Undefined)
                }
                if (returnTypes.length > 1) {
                    let expressions = new Array<Expression>()
                    for (let i = returnTypes.length - 1; i >= 0; i--) {
                        let type = returnTypes[i]
                        expressions.push(
                            ast.TypeExpression.is(type)
                            ? type.value
                            : new ast.BinaryExpression({ left: new ast.DotExpression({}), operator: "is", right: type, location: type.location})
                        )
                    }
                    returnType = simplify(new ast.TypeExpression({ location: func.body.location, value: combineExpressions(expressions, "||") })) as any
                }
                else if (returnTypes.length === 0) {
                    returnType = types.Undefined
                }
                else if (returnTypes.length === 1) {
                    returnType = returnTypes[0]
                }
            }
        }
        // we also need to infer the function signature type
        let type = func.type != null ? func.type : new ast.FunctionType({ params: func.params.map(p => resolved.get(p)!.type! ?? types.Any), returnType })
        return { returnType, type }
    },
    VariableDeclaration(node, {resolved}) {
        if (node.type == null) {
            let value = resolved.get(node.value) ?? node.value
            //  the "type" of a type declaration is the value
            //  otherwise the type is the values type
            let type: ast.Type | undefined
            if (value?.type != null) {
                type = value?.type
            }
            else if (ast.Type.is(value)) {
                type = value
            }
            return { type }
        }
    },
    Declarator(node, {resolved, scopeMap, ancestorsMap}) {
        let parent = ancestorsMap.get(node)
        parent = resolved.get(parent) ?? parent
        if (Typed.is(parent)) {
            return { type: parent.type }
        }
    },
    Reference(node, {resolved, scopeMap, ancestorsMap}) {
        let declarator = getDeclarator(node, resolved, scopeMap)
        let type = declarator?.type ?? null
        if (type == null) {
            // check if this is a reference to a global type
            let globalType = types[node.name]
            if (globalType?.path === node.path) {
                type = globalType
            }
        }
        // Infer in chained conditionals here.
        // if we are the right side of a A & B conditional then that implies A
        type = getChainedConditionalTypeAssertion(ancestorsMap, resolved, type, node, "&&", false);
        // if we are the right side of a A | B optional then that implies not A
        type = getChainedConditionalTypeAssertion(ancestorsMap, resolved, type, node, "||", true);
        // if we are a consequent or alternate of an A ? B : C conditional that implies either A or not A
        type = getChainedConditionalTypeAssertion(ancestorsMap, resolved, type, node, "?");
        return { type }
    },
    CallExpression(node, {resolved, scopeMap, ancestorsMap, originalMap}) {
        let callee = resolved.get(node.callee) ?? node.callee
        let calleeType = getFunctionType(callee.type!, resolved, scopeMap)
        // console.log("......... " + toCodeString(calleeType))
        if (!ast.FunctionType.is(calleeType)) {
            return
        }
        return { type: calleeType.returnType }
    },
    MemberExpression(node, {resolved, scopeMap, ancestorsMap}) {
        let object = resolved.get(node.object) ?? node.object
        let objectType = getType(object.type, resolved, scopeMap)
        if (ast.TypeExpression.is(objectType)) {
            let property = resolved.get(node.property) ?? node.property
            let type = getMemberTypeExpression(objectType, property)
            if (type != null) {
                return { type }
            }
        }
    },
}

export const typeProperties = new Set(["type", "returnType", "instanceType"])

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
