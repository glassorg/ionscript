import { Options } from "../Compiler";
import { getDeclarator, SemanticError } from "../common";
import { traverse, skip } from "@glas/traverse"
import { VariableDeclaration, Identifier, Literal, Assembly, ClassDeclaration, Declaration, Reference, Node, Declarator, FunctionExpression, BlockStatement, AssignmentPattern, ObjectPattern, ObjectExpression, Parameter, Property, ExpressionStatement, AssignmentExpression, MemberExpression, ThisExpression, IfStatement, DotExpression, Statement, Expression, Type, TypeExpression, BinaryExpression, UnaryExpression, ThrowStatement, CallExpression } from "../ast";
import createScopeMaps from "../createScopeMaps";
import toCodeString from "../toCodeString";

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
            let baseClasses = new Map<string,Reference>([...classDeclaration.baseClasses as Array<Reference>].map(r => [r.name, r]))
            function addDeclarations(declarations: Iterable<VariableDeclaration>, patch?) {
                for (let declaration of declarations) {
                    if (!Identifier.is(declaration.id)) {
                        baseDeclarations.set(JSON.stringify(declaration.id), declaration)
                        continue
                        // throw SemanticError("invalid destructuring on class variable", declaration.id)
                    }
                    if (declaration.id.name === "constructor") {
                        // we don't inherit constructors, they are added automatically one per concrete class
                        continue
                    }
                    let current = baseDeclarations.get(declaration.id.name)
                    let newValue = current ? mergeDeclarations(current, declaration) : declaration
                    if (patch != null) {
                        newValue = newValue.patch(patch)
                    }
                    baseDeclarations.set(declaration.id.name, newValue)
                }
            }
            for (let baseClass of classDeclaration.baseClasses) {
                let declarator = getDeclarator(baseClass as Reference, scopes, ancestorsMap, true)!

                let baseDeclaration = ancestorsMap.get(declarator) as ClassDeclaration
                if (!ClassDeclaration.is(baseDeclaration)) {
                    continue
                    // we now just skip if not found to allow single file compilation.
                    // if (!options.emit) {
                    //     // probably a quick incremental compile, so we just ignore
                    // }
                    // throw SemanticError(`Not a class declaration`, baseClass)
                }

                if (classDeclaration.isStruct && !baseDeclaration.isStruct) {
                    throw SemanticError(`Structs cannot inherit from classes`, baseClass)
                }
                if (!baseDeclaration.isData) {
                    throw SemanticError(`Data classes can only inherit from other data classes`, baseClass)
                }
                baseDeclaration = ensureDeclarationsInherited(baseDeclaration, source)
                for (let ref of baseDeclaration.baseClasses as Array<Reference>) {
                    baseClasses.set(ref.name, ref)
                }
                addDeclarations(baseDeclaration.instance.declarations, { inherited: true })
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
            }
        }
    })

}