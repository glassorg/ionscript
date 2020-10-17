import { Options } from "../Compiler";
import { getDeclarator, SemanticError } from "../common";
import { traverse, skip } from "@glas/traverse"
import { VariableDeclaration, Identifier, Literal, Assembly, ClassDeclaration, Declaration, Reference, Node, Declarator, FunctionExpression, BlockStatement, AssignmentPattern, ObjectPattern, ObjectExpression, Parameter, Property, ExpressionStatement, AssignmentStatement, MemberExpression, ThisExpression, IfStatement, DotExpression, Statement, Expression, Type, TypeExpression, BinaryExpression, UnaryExpression, ThrowStatement, CallExpression } from "../ast";
import createScopeMaps from "../createScopeMaps";
import { replaceNodes } from "./runtimeTypeChecking";

function mergeDeclarations(base: VariableDeclaration, sub: VariableDeclaration) {
    // this should actually check that the types can be merged.
    return sub
}

// cannot extend from ion.Object until we provide ability to change reserved names.
// const rootClassReference = new Reference({ name: getAbsoluteName("ion.Object", "Object")})

export default function inheritBaseClasses(root: Assembly, options: Options) {
    let ancestorsMap = new Map<Node, Node>()
    let scopes = createScopeMaps(root, { ancestorsMap })

    let finished = new Map<ClassDeclaration,ClassDeclaration>()
    let inprogress = new Set<ClassDeclaration>()
    function ensureDeclarationsInherited(classDeclaration: ClassDeclaration, source: Node): ClassDeclaration {
        let result = finished.get(classDeclaration)
        if (result == null) {
            if (inprogress.has(classDeclaration)) {
                throw SemanticError(`Circular class extension`, source)
            }
            inprogress.add(classDeclaration)
            let baseDeclarations = new Map<string, VariableDeclaration>()
            let baseClasses = new Map<string,Reference>([...classDeclaration.baseClasses].map(r => [r.name, r]))
            function addDeclarations(declarations: Iterable<VariableDeclaration>) {
                for (let declaration of declarations) {
                    if (!Identifier.is(declaration.id)) {
                        throw SemanticError("invalid destructuring on class variable", declaration.id)
                    }
                    if (declaration.id.name === "constructor") {
                        // we don't inherit constructors, they are added automatically one per concrete class
                        continue
                    }
                    let current = baseDeclarations.get(declaration.id.name)
                    baseDeclarations.set(
                        declaration.id.name,
                        current ? mergeDeclarations(current, declaration) : declaration
                    )
                }
            }
            for (let baseClass of classDeclaration.baseClasses) {
                let declarator = getDeclarator(baseClass, scopes, ancestorsMap, true)
                let baseDeclaration = ancestorsMap.get(declarator) as ClassDeclaration
                if (!ClassDeclaration.is(baseDeclaration)) {
                    throw SemanticError(`Not a class declaration`, baseClass)
                }

                if (classDeclaration.isStruct && !baseDeclaration.isStruct) {
                    throw SemanticError(`Structs cannot inherit from classes`, baseClass)
                }
                if (!baseDeclaration.isData) {
                    throw SemanticError(`Data classes can only inherit from other data classes`, baseClass)
                }
                baseDeclaration = ensureDeclarationsInherited(baseDeclaration, source)
                for (let ref of baseDeclaration.baseClasses) {
                    baseClasses.set(ref.name, ref)
                }
                addDeclarations(baseDeclaration.instance.declarations)
            }
            // // now insert the current class declarations
            addDeclarations(classDeclaration.instance.declarations)
            // // override properties with the same name
            result = classDeclaration.patch({
                baseClasses: Array.from(baseClasses.values()),
                instance: classDeclaration.instance.patch({
                    declarations: [
                        ...baseDeclarations.values(),
                    ]
                })
            })
            finished.set(classDeclaration, result)
        }
        inprogress.delete(classDeclaration)
        return result
    }

    return traverse(root, {
        leave(node) {
            if (ClassDeclaration.is(node) && node.isData) {
                let declaration = ensureDeclarationsInherited(node, node)
                return declaration
                // TODO: Do we really need to track these implements here?
                // or is there another way later to determine these?
                // let names = [getUniqueClientName(node.id.name), ...declaration.baseClasses.map(d => getUniqueClientName(d.name))]
                // let typeNameDeclarations = names.map(name => {
                //     return new VariableDeclaration({
                //         location: node.location,
                //         id: new Identifier({ name }),
                //         assignable: false,
                //         value: new Literal({ value: true })
                //     })
                // })
                // return declaration.patch({
                //     // _implements: names,
                //     declarations: new Map([
                //         ...declaration.declarations.values(),
                //         ...typeNameDeclarations,
                //         new VariableDeclaration({
                //             location: node.location,
                //             id: new Identifier({ name: "classId" }),
                //             assignable: false,
                //             value: new Literal({ value: getUniqueClientName(node.id.name) })
                //         })
                //     ].map(d => [d.id.name, d])),
                // })
            }
        }
    })

}