import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import { BinaryExpression, CallExpression, Exportable, FunctionExpression, Identifier, ImportDeclaration, Literal, Node, Parameter, Program, RegularExpression, SwitchCase, TypeExpression, UnaryExpression } from "../ast"
import Position from "../ast/Position"
import VariableDeclaration from "../ast/VariableDeclaration"
import Reference from "../ast/Reference"
import MemberExpression from "../ast/MemberExpression"
import Expression from "../ast/Expression"
import Declaration from "../ast/Declaration"
import ClassDeclaration from "../ast/ClassDeclaration"
import AssignmentStatement from "../ast/AssignmentStatement"
import { SemanticError } from "../common"
import Declarator from "../ast/Declarator"

const operatorMap = {
    "==": "==="
}

export default function toEsTree(root: Map<string, any>, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Position.is(node)) {
                return skip
            }
        },
        merge(node, changes, helper) {
            if (Node.is(node)) {
                // convert negative literal number to unary negation
                if (Literal.is(node) && typeof node.value === "number" && node.value < 0) {
                    return {
                        type: "UnaryExpression",
                        operator: "-",
                        prefix: true,
                        argument: { type: "Literal", value: Math.abs(node.value) }
                    }
                }
                //  Convert Reference and Declarators to Identifier
                //  (They are both Identifier subclasses)
                if (Identifier.is(node)) {
                    return {
                        type: "Identifier",
                        name: node.name
                    }
                }
                // Our VariableDeclarations diverge from ESTree for simplicity so we convert back.
                let result: any
                if (VariableDeclaration.is(node)) {
                    let values = { ...node, ...changes }
                    result = {
                        type: "VariableDeclaration",
                        kind: node.kind === "conditional" ? node.kind : node.kind === "var" ? "let" : "const",
                        declarations: [{
                            type: "VariableDeclarator",
                            id: values.id,
                            init: values.value,
                            kind: node.kind,
                        }]
                    }
                }
                else if (AssignmentStatement.is(node)) {
                    let values = { ...node, ...changes }
                    result = {
                        type: "ExpressionStatement",
                        expression: {
                            type: "AssignmentExpression",
                            left: values.left,
                            operator: values.operator,
                            right: values.right,
                        }
                    }
                }
                else if (Parameter.is(node)) {
                    if (node.value != null) {
                        result = {
                            type: "AssignmentPattern",
                            left: changes.id,
                            right: changes.value,
                        }
                    }
                    else {
                        result = changes.id
                    }
                }
                else if (RegularExpression.is(node)) {
                    try {
                        return {
                            type: "Literal",
                            value: new RegExp(node.pattern, node.flags)
                        }
                    }
                    catch(e) {
                        throw SemanticError(e.message, node)
                    }
                }
                else {
                    result = { ...node, ...changes, type: node.constructor.name }
                }
                //  convert UnaryExpressions to UpdateExpressions if they use ++ or --
                if (UnaryExpression.is(node) && (node.operator === "++" || node.operator === "--")) {
                    result.type = "UpdateExpression"
                }
                // Add computed to MemberExpressions with Expressions as their property.
                if (MemberExpression.is(node) && Expression.is(node.property)) {
                    result.computed = true
                }
                // handle exports
                if (Exportable.is(node) && node.export > 0) {
                    if (ImportDeclaration.is(node)) {
                        result = replace({
                            type: "ExpressionStatement",
                            expression: { type: "Literal", value: "Fuck" },
                        }, {
                            type: "ExpressionStatement",
                            expression: { type: "Literal", value: "You" },
                        })
                    }
                    else {
                        result = {
                            type: node.export === 2 ? "ExportDefaultDeclaration" : "ExportNamedDeclaration",
                            declaration: result,
                            specifiers: [],
                            source: null,
                        }
                    }
                }
                if (BinaryExpression.is(node)) {
                    result.operator = operatorMap[node.operator] ?? node.operator
                }
                if (SwitchCase.is(node)) {
                    // EsTree SwitchCase.consequent: Array<Statement>
                    // Ours is BlockStatement, so we convert to theirs.
                    result.consequent = result.consequent?.body ?? []
                }
                if (CallExpression.is(node) && node.new) {
                    result.type = "NewExpression"
                }
                if (ClassDeclaration.is(node)) {
                    let values = { ...node, ...changes }
                    let declarations = [...values.instance.declarations, ...values.static]
                    let originals = [...node.instance.declarations, ...node.static]
                    return {
                        type: "ClassDeclaration",
                        id: values.id,
                        superClass: values.baseClasses[0],
                        body: {
                            type: "ClassBody",
                            body: declarations.map((v, index) => {
                                let original = originals[index]!
                                if (!FunctionExpression.is(original.value)) {
                                    return null
                                }
                                let d = v.declarations[0]
                                return {
                                    type: "MethodDefinition",
                                    key: d.id,
                                    value: d.init,
                                    kind: (() => {
                                        switch (d.kind) {
                                            case "let":
                                            case "var": return "method"
                                            case "get": return "get"
                                            case "set": return "set"
                                        }
                                    })(),
                                    //  calculate if computed or not
                                    computed: Expression.is(original.id),
                                    static: original.static
                                }
                            }).filter(value => value != null)
                        }
                    }
                }
                return result
            }
        }
    })
}
