import { Options } from "../Compiler"
import { traverse, skip } from "@glas/traverse"
import { Assembly, Node, Typed, Expression } from "../ast"
import * as ast from "../ast"
import * as types from "../types"
import { ScopeContext, ScopeMaps } from "../createScopeMaps"
import getSortedTypedNodes, { getContainingIfTestAndOriginalDeclarator, getPredecessors } from "../analysis/getSortedTypedNodes"
import evaluate from "../analysis/evaluate"
import { getAncestorsAndSelfList, SemanticError } from "../common"
import simplify from "../analysis/simplify"
import toCodeString from "../toCodeString"
import getLeftMostMemberObject from "../analysis/getLeftMostMemberObject"
import splitExpressions from "../analysis/splitExpressions"
import combineExpressions from "../analysis/combineExpressions"
import getMemberTypeExpression from "../analysis/getMemberTypeExpression"
import getFinalStatements from "../analysis/getFinalStatements"
import and, { simplifyType } from "../analysis/combineTypeExpression"
import negate from "../analysis/negate"
import { replaceNodes } from "./runtimeTypeChecking"

type Resolved = { get<T>(t: T): T }

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
    //  we cannot further refine the type of function types or literals
    //  only references and type expressions
    if (ast.FunctionType.is(type) || ast.Literal.is(type)) {
        return type
    }
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
function getType(node: ast.Type | null, c: InferContext): ast.Type | null {
    if (ast.Reference.is(node)) {
        let declarator = getDeclarator(node, c)
        if (declarator != null) {
            let declaration = c.getResolved(c.getParent(declarator))
            if (ast.ClassDeclaration.is(declaration)) {
                // we want a type and that type will be the instanceType
                return declaration.instanceType
            }
            let result = getType(declarator.type, c)
            return result
        }
    }
    if (ast.Type.is(node)) {
        return node
    }
    return null
}

function getClassDeclaration(node: ast.Reference, c: InferContext) {
    let declarator = getDeclarator(node, c)
    if (declarator) {
        let baseDeclaration = c.getParent(declarator)
        baseDeclaration = c.getResolved(baseDeclaration)
        if (ast.ClassDeclaration.is(baseDeclaration)) {
            return baseDeclaration
        }
    }
    return null
}

function getFunctionType(node: ast.Type, c: InferContext) {
    let type = getType(node, c)
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

function getConstructorType(node: ast.ClassDeclaration, c: InferContext, returnType: ast.Reference | null = null) : ast.FunctionType | null {
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
        returnType = new ast.Reference(node.id)
    }
    let ctor = node.instance.declarations.find(d => ast.VariableDeclaration.is(d) && (d.id as ast.Declarator).name === "constructor")
    if (ctor == null) {
        for (let base of node.baseClasses) {
            let baseDeclaration = getClassDeclaration(base, c)
            if (baseDeclaration != null) {
                let baseType = getConstructorType(baseDeclaration, c, returnType)
                if (baseType != null) {
                    return baseType.patch({ returnType })
                }
            }
        }
    }
    else {
        // return the type of the ctor.
        let { value } = ctor
        value = c.getResolved(value)
        if (value != null && ast.FunctionType.is(value?.type)) {
            return value.type
        }
    }

    // default constructor
    return returnDefault ? new ast.FunctionType({
        params: [],
        returnType: new ast.Reference(node.id)
    }) : null
}

function getDeclarator(node: ast.Reference, c: InferContext): ast.Declarator | null {
    node = c.getResolved(node)
    let referencedNode = c.getDeclarator(node)
    if (ast.Reference.is(referencedNode)) {
        return c.getResolved(getDeclarator(referencedNode, c))
    }
    else if (ast.Declarator.is(referencedNode)) {
        return c.getResolved(referencedNode)
    }
    else {
        return null
        // console.error(`Referenced node is not a declaration ${node.name}`, referencedNode)
        // throw new Error("Referenced node is not a declaration")
    }
}

function getChainedConditionalTypeAssertion(
    c: InferContext,
    type: ast.Type | null,
    node: ast.Reference,
    operator: "&&" | "||" | "?",
    negateValue?: boolean
) {
    let alist = getAncestorsAndSelfList(node, c.ancestors)
    let expressionIndex = alist.findIndex(node =>  {
        if (operator === "?") {
            return ast.ConditionalExpression.is(node)
        }
        return ast.BinaryExpression.is(node) && node.operator === operator
    })
    if (expressionIndex >= 0) {
        let parent = c.getResolved(alist[expressionIndex]);
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

function toTypeExpression(type: ast.Type | ast.Expression | null): ast.TypeExpression | null {
    if (ast.TypeExpression.is(type)) {
        return type
    }
    if (ast.Reference.is(type) || ast.Literal.is(type)) {
        return new ast.TypeExpression({
            value: new ast.BinaryExpression({
                left: new ast.DotExpression({}),
                operator: ast.Reference.is(type) ? "is" : "==",
                right: type
            })
        })
    }
    if (ast.Expression.is(type)) {
        return new ast.TypeExpression({ value: type })
    }
    return null
    // throw new Error("getTypeExpression not implemented for " + type.constructor.name)
}

export const inferType: {
    [P in keyof typeof ast]?: (node: InstanceType<typeof ast[P]>, c: InferContext) => any
} = {
    BinaryExpression(node) {
        // for now just use the left type
        let type = binaryOperationsType[node.operator]
        if (type == null) {
            throw SemanticError(`Could not find type for operator: ${node.operator}`, node)
        }
        return { type }
    },
    UnaryExpression(node) {
        // for now just use the left type
        let type = unaryOperationsType[node.operator]
        if (type == null) {
            throw SemanticError(`Could not find type for operator: ${node.operator}`, node)
        }
        return { type }
    },
    RegularExpression(node) {
        return { type: types.RegExp }
    },
    Literal(node) {
        // literals are their own type
        let literalType = literalTypes[typeof node.value]!
        let baseType: ast.TypeExpression
        if (Number.isInteger(node.value)) {
            literalType = types.Integer
        }
        let type = toTypeExpression(
            and(
                toTypeExpression(literalType),
                toTypeExpression(new ast.Literal({ value: node.value })),
            )
        )
        return { type }
    },
    ObjectExpression(node, c) {
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
                let pkey = c.getResolved(p.key)
                let pvalue = c.getResolved(p.value)
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
                let arg = c.getResolved(p.argument)
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
    ArrayExpression(node, c) {
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
            p = c.getResolved(p)
            if (ast.Expression.is(p)) {
                length++
                expressions.push(new ast.BinaryExpression({
                    left: new ast.MemberExpression({ object: new ast.DotExpression({}), property: new ast.Literal({ value: index }) }),
                    operator: "is",
                    right: p.type!
                }))
            }
            else if (ast.SpreadElement.is(p)) {
                let arg = c.getResolved(p.argument)
                let argType = getType(arg.type, c)
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
    ConditionalDeclaration(node, c) {
        const name = (node.id as ast.Reference).name
        let [newKnownType, containingVarDeclarator] = getContainingIfTestAndOriginalDeclarator(node, c.scopes, c.ancestors)
        newKnownType = c.getResolved(newKnownType)
        containingVarDeclarator = c.getResolved(containingVarDeclarator)
        if (node.negate) {
            newKnownType = negate(newKnownType)
        }
        let type = getImpliedType(containingVarDeclarator?.type ?? null, newKnownType, name)
        return { type }
    },
    ClassDeclaration(node, c) {
        // calculate a TypeExpression that can be used to compare these instances
        let instanceExpressions = new Array<Expression>()
        instanceExpressions.push(is(new ast.Reference({ name: node.id.path! })))
        // with normal (non-data) classes, we should combine actual instanceType from class 
        for (let base of node.baseClasses) {
            if (!node.isData) {
                let baseDeclaration = getClassDeclaration(base, c)
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
                d = c.getResolved(d)
                if (ast.VariableDeclaration.is(d)) {
                    let dotMember = new ast.MemberExpression({ object: new ast.DotExpression({}), property: d.id })
                    switch (d.kind) {
                        case "var":
                            if (ast.TypeExpression.is(d.type)) {
                                yield* [...splitExpressions(d.type.value)].map(term => replaceNodes(term, ast.DotExpression.is, dotMember))
                            }
                            else {
                                yield is(d.type!, dotMember)
                            }
                            break;
                        case "let":
                            yield new ast.BinaryExpression({
                                left: dotMember,
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
                is(getConstructorType(node, c)!),
                is(types.Class),
                is(types.Function),
                ...getAssertions(node.static)
            ])
        })

        return { instanceType, type }
    },
    Parameter(node, c) {
        return inferType.VariableDeclaration?.apply(this, arguments as any)
    },
    FunctionExpression(func, c) {
        // traverse and find all return types
        let returnType = func.returnType
        if (returnType == null) {
            // see if we are a constructor...
            if (func.id?.name === "constructor") {
                let parent = c.getParent(func)
                if (ast.VariableDeclaration.is(parent) && parent.instance) {
                    let clas = c.getAncestor(parent, ast.ClassDeclaration.is)
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
                            let resolvedValue = c.getResolved(node.argument)
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
        let type = func.type != null
            ? func.type
            : new ast.FunctionType({
                params: func.params.map(
                    p => {
                        let ptype = c.getResolved(p)?.type ?? null
                        return ast.RestElement.is(p.id) ? new ast.SpreadElement({ location: p.location, argument: ptype ?? types.Array }) : ptype
                    }
                ), returnType
            })
        return { returnType, type }
    },
    VariableDeclaration(node, c) {
        if (node.type == null) {
            let value = c.getResolved(node.value)
            //  the "type" of a type declaration is the value
            //  otherwise the type is the values type
            let type: ast.Type | undefined
            if (value?.type != null) {
                type = value?.type
                //  if this variable is reassignable, then we remove the initial literal value
                //  from the variable type. So String & . == "foo" becomes => String
                if (node.kind === "var" && ast.TypeExpression.is(type)) {
                    type = type.patch({
                        value: combineExpressions([...splitExpressions(type.value)].filter(
                            term => {
                                if (ast.BinaryExpression.is(term) && term.operator === "==" && ast.DotExpression.is(term.left) && ast.Literal.is(term.right)) {
                                    return false
                                }
                                return true
                            }
                        ))
                    })
                }
            }
            else if (ast.Type.is(value)) {
                type = value
            }
            return { type }
        }
    },
    Declarator(node, c) {
        let parent = c.getResolved(c.getParent(node))
        if (Typed.is(parent)) {
            return { type: parent.type }
        }
    },
    Reference(node, c) {
        let declarator = getDeclarator(node, c)
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
        type = getChainedConditionalTypeAssertion(c, type, node, "&&", false);
        // if we are the right side of a A | B optional then that implies not A
        type = getChainedConditionalTypeAssertion(c, type, node, "||", true);
        // if we are a consequent or alternate of an A ? B : C conditional that implies either A or not A
        type = getChainedConditionalTypeAssertion(c, type, node, "?");
        return { type }
    },
    AssignmentStatement(node, c) {
        let left = c.getResolved(node.left)
        let right = c.getResolved(node.right)
        if (left.type != null && right.type != null) {
            let check = c.isConsequent(toTypeExpression(right.type)!, toTypeExpression(left.type)!)
            if (check === false) {
                //  we only throw an error if we KNOW that a value is invalid.
                //  if it only might be invalid then we
                throw SemanticError(`Cannot assign type (${toCodeString(right.type)}) to type (${toCodeString(left.type)})`, left)
            }
        }
    },
    CallExpression(node, c) {
        let callee = c.getResolved(node.callee)
        let calleeType = getFunctionType(callee.type!, c)
        if (!ast.FunctionType.is(calleeType)) {

            // we don't know the type of the function so we won't type check
            return
        }

        // console.log("......... CHECK PARAMETERS! " + toCodeString(calleeType))
        for (let i = 0; i < node.arguments.length; i++) {
            let arg = c.getResolved(node.arguments[i])
            if (Expression.is(arg)) {
                // get callee type
                let paramType: ast.Type | ast.SpreadElement | null = calleeType.params[i]
                if (paramType == null) {
                    let lastType = calleeType.params[calleeType.params.length - 1]
                    if (!ast.SpreadElement.is(lastType)) {
                        throw SemanticError(`Target function only accepts ${calleeType.params.length} argument${calleeType.params.length === 1 ? '' : 's'}`, arg)
                    }
                    paramType = lastType
                }
                if (ast.SpreadElement.is(paramType)) {
                    let restType = paramType.argument as ast.Reference
                    paramType = restType.arguments?.[0] ?? null
                }
                if (paramType != null && arg.type != null) {
                    let check = c.isConsequent(toTypeExpression(arg.type)!, toTypeExpression(paramType)!)
                    if (check === false) {
                        //  we only throw an error if we KNOW that a value is invalid.
                        //  if it only might be invalid then we
                        throw SemanticError(`Argument of type (${toCodeString(arg.type)}) is not valid for expected parameter type (${toCodeString(paramType)})`, arg)
                    }
                    // console.log("(" + check + ") >>>>> " + toCodeString(arg) + " type " + toCodeString(arg.type) + " ::: " + toCodeString(paramType))
                }
            }
        }
        return { type: calleeType.returnType }
    },
    MemberExpression(node, c) {
        let object = c.getResolved(node.object)
        let objectType = getType(object.type, c)
        if (ast.TypeExpression.is(objectType)) {
            let property = c.getResolved(node.property)
            let type = getMemberTypeExpression(objectType, property)
            if (type != null) {
                return { type }
            }
        }
    },
}

export const typeProperties = new Set(["type", "returnType", "instanceType"])

class InferContext extends ScopeContext {

    resolved = new Map<Typed,Typed>() as Map<Typed,Typed> & Resolved

    constructor(root) {
        super(root, true)
    }

    setResolved(originalNode, currentNode) {
        this.resolved.set(originalNode, currentNode)
        if (originalNode !== currentNode) {
            // make sure that you can still get the correct scope for the new node
            this.scopes.set(currentNode, this.scopes.get(originalNode))
            // same for ancestors map
            this.ancestors.set(currentNode, this.ancestors.get(originalNode)!)
        }
    }

    getResolved(node) {
        return this.resolved.get(node) ?? node
    }

}

export default function inferTypes(root: Assembly, options: Options) {
    let sc = new InferContext(root)
    let ancestorsMap = sc.ancestors
    let scopes = sc.scopes
    let resolved = sc.resolved

    let sorted = getSortedTypedNodes(root, scopes, ancestorsMap)

    // let newTypeDeclarations = new Map<string, ast.TypeExpression>()
    // let typeNameToIdentifierName = new Map<string,string>()

    // let preferredTypeNameToIdentifierName = new Map<string,string>()
    // function getSharedTypeReference(node: ast.TypeExpression) {
    //     let name = toCodeString(node)
    //     let absoluteName = typeNameToIdentifierName.get(name)
    //     if (absoluteName == null) {
    //         let localName = preferredTypeNameToIdentifierName.get(name) ?? "?TYPE:" +name // idGenerator.createNewIdName(name)
    //         absoluteName = getModulePath("_types", localName)
    //         typeNameToIdentifierName.set(name, absoluteName)
    //         // see if we can find sub-nodes within this thingy
    //         let declaration = new ast.TypeExpression({
    //             value: traverse(node, {
    //                 leave(child) {
    //                     if (child !== node && Node.is(child)) {
    //                         let code = toCodeString(child)
    //                         let foundSubexpression = preferredTypeNameToIdentifierName.get(code)
    //                         if (foundSubexpression) {
    //                             return new ast.Reference({ name: foundSubexpression })
    //                         }
    //                     }
    //                 }
    //             })
    //         })
    //         newTypeDeclarations.set(absoluteName, declaration)
    //     }
    //     return new ast.Reference({ location: node.location, name: absoluteName })
    // }

    function ensureResolved(originalNode: Typed, resolveDependenciesFirst = false) {
        if (resolved.has(originalNode)) {
            return resolved.get(originalNode)
        }

        if (resolveDependenciesFirst) {
            for (let pred of getPredecessors(originalNode, scopes, ancestorsMap)) {
                ensureResolved(pred, resolveDependenciesFirst)
            }
        }

        // first try to simplify
        let currentNode = resolved.get(originalNode) as Typed ?? originalNode
        currentNode = evaluate(currentNode, resolved, scopes)
        sc.setResolved(originalNode, currentNode)
        // then try to infer types
        if (currentNode.type == null) {
            let func = inferType[currentNode.constructor.name]
            let changes = func?.(currentNode, sc)
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
            sc.setResolved(originalNode, currentNode)
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
}
