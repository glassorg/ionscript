import { Options } from "../Compiler";
import { traverse, skip, replace } from "@glas/traverse";
import Assembly from "../ast/Assembly";
import { ArrayExpression, AssignmentExpression, BinaryExpression, BlockStatement, CallExpression, ClassDeclaration, Declarator, DotExpression, Expression, ExpressionStatement, FunctionExpression, Identifier, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, InstanceDeclarations, Literal, MemberExpression, ObjectExpression, Parameter, Program, Property, Reference, RegularExpression, ReturnStatement, ThisExpression, TypeExpression, VariableDeclaration, Range, ForOfStatement, UnaryExpression, SpreadElement, FunctionType, RuntimeType, EnumDeclaration, Variable } from "../ast";
import { replaceNodes, toRuntimeType } from "./runtimeTypeChecking";
import { typeProperties } from "./inferTypes";
import { hasDeclarator, runtimeModuleName, SemanticError } from "../common";
import createTypeCheck from "../../createTypeCheck";
import toCodeString from "../toCodeString";

function mergeGetSetPairs(properties: Array<ArrayExpression>) {
    let mergedProperties = new Map<string, ArrayExpression>()
    for (let keyValueArrayExpression of properties) {
        let [key, value] = keyValueArrayExpression.elements
        let keyString = key!.constructor.name + "_" + toCodeString(key!)
        let existingProperty = mergedProperties.get(keyString)
        if (existingProperty != null) {
            mergedProperties.set(keyString, new ArrayExpression({
                elements: [
                    key,
                    newProperties(
                        [
                            ...(existingProperty.elements[1] as any).arguments[0].properties,
                            ...(value as any).arguments[0].properties,
                        ]
                    )
                ]
            }))
        }
        else {
            mergedProperties.set(keyString, keyValueArrayExpression)
        }
    }
    return [...mergedProperties.values()]
}

function newProperties(properties) {
    return new CallExpression({
        new: true,
        callee: new MemberExpression({
            object: new Reference({ name: runtimeModuleName }),
            property: new Identifier({ name: "Property" })
        }),
        arguments: [
            new ObjectExpression({
                properties    
            })
        ]
    })
}

export default function createRuntime(root: Assembly, options: Options) {
    return traverse(root, {
        enter(node) {
            if (Program.is(node)) {
                return skip
            }
        },
        leave(node) {
            if (Program.is(node)) {
                let usesIonscript = false
                node = traverse(node, {
                    enter(node) {
                        if (VariableDeclaration.is(node) && node.kind === "type") {
                            return skip
                        }
                        // cannot skip TypeExprssions as we need to convert 'is' operators within them to is calls.
                        // if (TypeExpression.is(node)) {
                        //     return skip
                        // }
                    },
                    leave(node, ancestors, path) {
                        if (EnumDeclaration.is(node)) {
                            usesIonscript = true
                            // we will convert this to something else.
                            let { location } = node
                            return new VariableDeclaration({
                                location,
                                export: node.export,
                                kind: "let",
                                id: new Declarator(node.id),
                                value: new CallExpression({
                                    location,
                                    new: true,
                                    callee: new MemberExpression({
                                        location,
                                        object: new Reference({ location, name: runtimeModuleName }),
                                        property: new Identifier({ location, name: "Enum" }),
                                    }),
                                    arguments: [
                                        new Literal({ location, value: node.id.name }),
                                        new ObjectExpression({ properties: node.properties })
                                    ]
                                })
                            })
                        }
                        //  types here.
                        if (Reference.is(node)) {
                            if (node.name === runtimeModuleName) {
                                usesIonscript = true
                            }
                        }
                        // add external count if needed to for arrays
                        if (ForOfStatement.is(node) && node.count != null) {
                            let { location } = node
                            let insideCountName = (node.count.id as Declarator).name
                            let outsideCountName = "_" + insideCountName + "_"
                            return new BlockStatement({
                                location,
                                body: [
                                    new VariableDeclaration({ ...node.count, id: (node.count.id as Declarator).patch({ name: outsideCountName }), kind: "var", value: new Literal({ location, value: 0 }) }),
                                    node.patch({
                                        count: null,
                                        body: node.body.patch({
                                            body: [
                                                new VariableDeclaration({
                                                    kind: "let",
                                                    id: new Declarator({ name: insideCountName }),
                                                    value: new Reference({ name: outsideCountName }),
                                                }),
                                                ...node.body.body,
                                                new ExpressionStatement({
                                                    location,
                                                    expression: new UnaryExpression({
                                                        location,
                                                        operator: "++",
                                                        argument: new Reference({
                                                            location: node.count.location,
                                                            name: outsideCountName,
                                                        })
                                                    })
                                                })
                                            ]
                                        })
                                    }),
                                ]
                            })
                        }
                        if (Range.is(node)) {
                            // replace with call to ionscript.range(start, end, inclusive, step)
                            usesIonscript = true
                            let { location } = node
                            let args = [node.start, node.end]
                            if (node.inclusive || node.step) {
                                args.push(new Literal({ location, value: node.inclusive }))
                            }
                            if (node.step) {
                                args.push(node.step)
                            }
                            return new CallExpression({
                                location,
                                callee: new MemberExpression({
                                    location,
                                    object: new Reference({ location, name: runtimeModuleName }),
                                    property: new Identifier({ location, name: "range" }),
                                }),
                                arguments: args,
                            })
                        }
                        if (TypeExpression.is(node)) {
                            let last = path[path.length - 1]
                            if (typeProperties.has(last)) {
                                return null
                            }
                            return node.value
                        }
                        if (VariableDeclaration.is(node) && node.kind === "meta") {
                            usesIonscript = true
                            if (!Declarator.is(node.id)) {
                                throw SemanticError("Meta must be an id, not a destructuring pattern", node.id)
                            }
                            return node.patch({
                                kind: "let",
                                value: new CallExpression({
                                    new: true,
                                    callee: new MemberExpression({
                                        object: new Reference({ name: runtimeModuleName }),
                                        property: new Identifier({ name: "MetaProperty" })
                                    }),
                                    arguments: [
                                        new Literal({ value: node.id.name}),
                                        // new Literal({ value: node.id.path}),
                                        toRuntimeType(node.type, node.id.name),
                                        ...(node.value ? [node.value] : []),
                                    ]
                                })
                            })
                        }
                        if (FunctionType.is(node)) {
                            //  we do NOT have runtime function type checking yet
                            //  so we at least just verify that it is in fact a function.
                            return new Reference({ name: "Function" })
                        }
                        if (BinaryExpression.is(node) && node.operator === "is") {
                            if (RuntimeType.is(node.right)) {
                                let templateArgs = Reference.is(node.right) ? node.right.arguments || [] : []
                                // we only support reference template args for now
                                if (!templateArgs.every(Reference.is)) {
                                    templateArgs = []
                                }
                                // only allow templateArgs
                                usesIonscript = true
                                return new CallExpression({
                                    callee: new MemberExpression({
                                        object: new Reference({ name: runtimeModuleName }),
                                        property: new Identifier({ name: "is" }),
                                    }),
                                    arguments: [ node.left, node.right, ...templateArgs ],
                                })
                            }
                            else {
                                return replaceNodes(node.right, DotExpression.is, node.left)
                            }
                        }
                        if (ClassDeclaration.is(node)) {
                            let result = node
                            if (!node.isData) {
                                //  iterate and find var variables with a default value
                                let instanceVarsWithDefaults = node.instance.declarations.filter(d => d.kind === "var" && d.value != null && Identifier.is(d.id))
                                if (instanceVarsWithDefaults.length > 0) {
                                    let ctor = node.instance.declarations.find(d => (d.id as Declarator).name === "constructor")
                                    let newCtor = ctor
                                        ?? new VariableDeclaration({
                                            kind: "let",
                                            id: new Declarator({ name: "constructor" }),
                                            value: new FunctionExpression({
                                                params: [],
                                                body: new BlockStatement({
                                                    body: node.baseClasses.length
                                                        ? [
                                                            new ExpressionStatement({
                                                                expression: new CallExpression({
                                                                    callee: new Reference({ name: "super"}),
                                                                    arguments: []
                                                                })
                                                            })
                                                        ]
                                                        : []
                                                })
                                            })
                                        })
                                    let newCtorBody = [
                                        ...instanceVarsWithDefaults.map(d => new ExpressionStatement({
                                            expression: new AssignmentExpression({
                                                left: new MemberExpression({
                                                    object: new ThisExpression({}),
                                                    property: new Identifier(d.id as Declarator)
                                                }),
                                                right: d.value!
                                            })
                                        })),
                                        ...(newCtor.value as FunctionExpression).body.body
                                    ]
                                    // move any super call back to the top.
                                    {
                                        let isSuper = node => node?.expression?.callee?.name === "super"
                                        let supers = newCtorBody.filter(isSuper)
                                        let nonSupers = newCtorBody.filter(n => !isSuper(n))
                                        newCtorBody = [...supers, ...nonSupers]
                                    }

                                    newCtor = newCtor.patch({
                                        value: (newCtor.value as FunctionExpression).patch({
                                            body: new BlockStatement({
                                                body: newCtorBody
                                            })
                                        })
                                    })
                                    let newInstances = [newCtor, ...node.instance.declarations.filter(d => d !== ctor)]
                                    result = result.patch({
                                        instance: new InstanceDeclarations({
                                            declarations: newInstances
                                        }),
                                        instanceType: null
                                    })
                                }
                            }
                            // remove extends from data classes and insert single extends from ionscript.Data
                            if (node.isData) {
                                result = result.patch({
                                    baseClasses:
                                        node.isStruct
                                        ? []
                                        : [
                                            new MemberExpression({
                                                object: new Reference({ name: runtimeModuleName }),
                                                property: new Identifier({ name: "Data" })
                                            })
                                        ],
                                    // also remove all the instance variable declarations
                                    // leave functions in for structs.
                                    instance: node.isStruct ? result.instance : result.instance!.patch({
                                        declarations: []
                                    })
                                })
                            }
                            //  handle static vars and typed vars
                            let staticVarsWithDefaults = node.static.filter(d => (d.kind === "var" || d.kind === "let") && d.value != null && !FunctionExpression.is(d.value))
                            if (node.isData) {
                                usesIonscript = true
                                staticVarsWithDefaults.push(
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        id: new Declarator({ name: "baseClasses" }),
                                        value: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: "Set"}),
                                            arguments: [
                                                new ArrayExpression({
                                                    elements: node.baseClasses
                                                })
                                            ]
                                        })
                                    }),
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        id: new Declarator({ name: "interfaces" }),
                                        value: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: "Set"}),
                                            arguments: [
                                                new ArrayExpression({
                                                    elements: node.interfaces
                                                })
                                            ]
                                        })
                                    })
                                )
                                staticVarsWithDefaults.push(
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        id: new Declarator({ name: "is" }),
                                        value: new CallExpression({
                                            callee: new MemberExpression({
                                                object: new Reference({ name: runtimeModuleName }),
                                                property: new Identifier({ name: createTypeCheck.name.valueOf() }),
                                            }),
                                            arguments: [ new Reference(node.id) ],
                                        })
                                    })
                                )
                                // insert (ClassName).prototype.properties
                                const instancePropertiesLocation = "prototype.properties"
                                staticVarsWithDefaults.push(
                                    new VariableDeclaration({
                                        static: new Identifier({ name: "static" }),
                                        kind: "var",
                                        //  this prototype.properties hack works fine in generated javascript
                                        //  could also do "prototype[ionscript.symbols.properties]"
                                        id: new Declarator({ name: instancePropertiesLocation }),
                                        value: new CallExpression({
                                            new: true,
                                            callee: new Reference({ name: "Map" }),
                                            arguments: [
                                                new ArrayExpression({
                                                    elements: [
                                                        ...node.baseClasses.map(
                                                            base => new SpreadElement({
                                                                argument: new MemberExpression({
                                                                    object: base,
                                                                    property: new Identifier({ name: instancePropertiesLocation })
                                                                })
                                                            })
                                                        ) as any,
                                                        ...mergeGetSetPairs(node.instance.declarations.filter(d => !d.inherited && d.instance && Identifier.is(d.id) && d.id.name !== "constructor").map(
                                                            d => {
                                                                let name = (d.id as Declarator).name
                                                                return new ArrayExpression({
                                                                    elements: [
                                                                        new Literal({ value: name }),
                                                                        newProperties((() => {
                                                                            let writable = d.kind === "var"
                                                                            let properties = new Array<Property>()
                                                                            // writable
                                                                            if (writable) {
                                                                                properties.push(
                                                                                    new Property({
                                                                                        key: new Identifier({ name: "writable" }),
                                                                                        value: new Literal({ value: writable }),
                                                                                    }),
                                                                                    // we also make any writable properties enumerable as well
                                                                                    new Property({
                                                                                        key: new Identifier({ name: "enumerable" }),
                                                                                        value: new Literal({ value: writable }),
                                                                                    }),
                                                                                )
                                                                            }
                                                                            if (d.type) {
                                                                                properties.push(
                                                                                    new Property({
                                                                                        key: new Identifier({ name: "type" }),
                                                                                        value: toRuntimeType(d.type, `${node.id.name}.${name}.Type`),
                                                                                    })
                                                                                )
                                                                            }
                                                                            if (d.value) {
                                                                                if (d.kind === "get" || d.kind === "set") {
                                                                                    properties.push(
                                                                                        new Property({
                                                                                            key: new Identifier({ name: d.kind }),
                                                                                            method: true,
                                                                                            value: d.value!,
                                                                                        })
                                                                                    )
                                                                                }
                                                                                else {
                                                                                    properties.push(
                                                                                        new Property({
                                                                                            key: new Identifier({ name: "value" }),
                                                                                            method: FunctionExpression.is(d.value),
                                                                                            value: d.value,
                                                                                        })
                                                                                    )
                                                                                }
                                                                            }
                                                                            if (d.meta) {
                                                                                for (let meta of d.meta) {
                                                                                    properties.push(
                                                                                        new Property({
                                                                                            key: new MemberExpression({
                                                                                                object: new Reference(meta.key as Reference),
                                                                                                property: new Identifier({ name: "symbol" })
                                                                                            }),
                                                                                            computed: true,
                                                                                            value: meta.value ? meta.value : new MemberExpression({
                                                                                                object: new Reference(meta.key as Reference),
                                                                                                property: new Identifier({ name: "defaultValue" })
                                                                                            })
                                                                                        })
                                                                                    )
                                                                                }
                                                                            }
                                                                            return properties
                                                                        })() as any)
                                                                    ]
                                                                })
                                                            }
                                                        ))
                                                    ]
                                                })
                                            ],
                                        })
                                    })
                                )
                            }
                            if (staticVarsWithDefaults.length > 0) {
                                result = replace(
                                    result,
                                    ...staticVarsWithDefaults.map(d => new ExpressionStatement({
                                        expression: new AssignmentExpression({
                                            left: new MemberExpression({
                                                object: new Reference(node.id),
                                                property: new Identifier(d.id as Declarator)
                                            }),
                                            right: d.value!
                                        })
                                    })),
                                ) as any
                            }
                            return result
                        }
                    }
                })
                // insert an import of ionscript
                if (usesIonscript && !hasDeclarator(node.body, runtimeModuleName)) {
                    node = node.patch({
                        body: [
                            new ImportDeclaration({
                                specifiers: [
                                    new ImportNamespaceSpecifier({
                                        local: new Declarator({ name: runtimeModuleName })
                                    })
                                ],
                                source: new Literal({ value: runtimeModuleName })
                            }),
                            ...node.body
                        ]
                    })
                }
                return node
            }
        }
    })
}
