import { Options } from "../Compiler"
import { traverse, skip, replace } from "@glas/traverse"
import Assembly from "../ast/Assembly"
import { AssignmentStatement, BlockStatement, CallExpression, ClassDeclaration, Declaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, IfStatement, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Property, Reference, ReturnStatement, ThisExpression, ThrowStatement, Type, TypeExpression, UnaryExpression, VariableDeclaration } from "../ast"
import { getLast } from "../common"

// let Vector_x = Symbol("Vector_x")
// let Vector_static_z = Symbol("Vector_static_z")
function getSymbolName(c: ClassDeclaration, d: VariableDeclaration) {
    return `${c.id.name}_${d.static ? 'static_' : ''}${(d.id as Identifier).name}`
}

function typeCheck(value: Expression, type: Type) {
    return new CallExpression({
        callee: new MemberExpression({
            object: type,
            property: new Identifier({ name: "is" }),
        }),
        arguments: [value]
    })
}

function replaceTypedVarsWithProperties(clas: ClassDeclaration, options: Options) {
    return traverse(clas, {
        enter(node) {
            if (!ClassDeclaration.is(node) && Declaration.is(node)) {
                return skip
            }
        },
        leave(node, ancestors, path) {
            if (VariableDeclaration.is(node)) {
                if (node.static || node.instance) {
                    if (node.kind === "var" && node.type != null) {
                        let classDeclaration = getLast(ancestors, ClassDeclaration.is)!
                        let name = getSymbolName(classDeclaration, node)
                        // can convert to get/set with types here, BUT that would mean suckitude.
                        // convert to type and shit
                        return replace(
                            new VariableDeclaration({
                                kind: "get",
                                id: node.id,
                                value: new FunctionExpression({
                                    params: [],
                                    body: new BlockStatement({
                                        body: [
                                            new ReturnStatement({
                                                argument: new MemberExpression({
                                                    object: new ThisExpression({}),
                                                    property: new Reference({ name })
                                                })
                                            })
                                        ]
                                    })
                                })
                            }),
                            new VariableDeclaration({
                                kind: "set",
                                id: node.id,
                                value: new FunctionExpression({
                                    params: [new Parameter({ id: new Declarator({ name: "value" }) })],
                                    body: new BlockStatement({
                                        body: [
                                            new IfStatement({
                                                test: new UnaryExpression({
                                                    operator: "!",
                                                    argument: typeCheck(new Reference({ name: "value" }), node.type!),
                                                }),
                                                consequent: new BlockStatement({
                                                    body: [
                                                        new ThrowStatement({
                                                            argument: new CallExpression({
                                                                new: true,
                                                                callee: new Reference({ name: "Error" }),
                                                                arguments: options.debug
                                                                    ? [new Literal({ value: `Invalid value for ${(node.id as Identifier).name}`})]
                                                                    : []
                                                            })
                                                        })
                                                    ]
                                                })
                                            }),
                                            new AssignmentStatement({
                                                left: new MemberExpression({
                                                    object: new ThisExpression({}),
                                                    property: new Reference({ name })
                                                }),
                                                right: new Reference({ name: "value" }),
                                            })
                                        ]
                                    })
                                })
                            }),
                        )
                    }
                }
            }            
        }
    })
}

export default function classPropertyTypeChecking(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Declaration.is(node)) {
                return skip
            }
        },
        leave(node, ancestors, path) {
            if (ClassDeclaration.is(node)) {
                // first find any typed vars we need to create symbols for
                //  handle typed variables by adding symbols to use for storing values
                let typedVars = [...node.static, ...node.instance.declarations].filter(d => d.type != null)
                if (typedVars.length > 0) {
                    return replace(
                        ...typedVars.map(d => {
                            let name = getSymbolName(node, d)
                            return new VariableDeclaration({
                                kind: "let",
                                id: new Declarator({ name }),
                                value: new CallExpression({
                                    callee: new Reference({ name: "Symbol" }),
                                    arguments: options.debug
                                        ? [new Literal({ value: name })]
                                        : []
                                })
                            })
                        }),
                        replaceTypedVarsWithProperties(node, options),
                    )
                }
            }
        }
    })
}
