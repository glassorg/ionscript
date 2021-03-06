import * as ast from "./ast";
import { Node } from "./ast";
import { memoize } from "./common";

const codeToString: { [P in keyof typeof ast]?: (node: InstanceType<typeof ast[P]>) => string} = {
    Identifier(node) {
        return node.name
    },
    Declarator(node) {
        return node.name
    },
    Reference(node) {
        return node.path ?? node.name
    },
    TypeExpression(node) {
        return s(node.value)
    },
    DotExpression(node) {
        return "."
    },
    ThisExpression(node) {
        return "this"
    },
    AssignmentPattern(node) {
        return `${toCodeString(node.left)} = ${toCodeString(node.right)}`
    },
    ObjectPattern(node) {
        return `{ ${node.properties.map(toCodeString).join(', ')} }`
    },
    ObjectExpression(node) {
        return `{ ${node.properties.map(toCodeString).join(', ')} }`
    },
    ArrayExpression(node) {
        return `[ ${node.elements.map(toCodeString).join(', ')} ]`
    },
    Program(node) {
        return `program ${node.id.name}`
    },
    FunctionExpression(node) {
        return `function ${(node.id as any)?.name ?? ''}(${node.params.map(toCodeString).join(',')})`
    },
    ArrowFunctionExpression(node) {
        return `(${node.params.map(toCodeString).join(',')}) => {?}`
    },
    FunctionType(node) {
        return `${node.async ? "async " : ""}(${node.params.map(toCodeString).join(',')}) => ${toCodeString(node.returnType)}`
    },
    ClassDeclaration(node) {
        return `class ${node.id.name}`
    },
    Property(node) {
        if (node.key != null) {
            if (ast.Identifier.is(node.key)) {
                return `${s(node.key)}:${s(node.value!)}`
            }
            else {
                return `[${s(node.key)}]:${s(node.value!)}`
            }
        }
        return `${s(node.value!)}`
    },
    Parameter(node) {
        let value = s(node.id)
        if (node.type) {
            value += `: ${s(node.type)}`
        }
        if (node.value) {
            value += ` = ${s(node.value)}`
        }
        return `${value}`
    },
    Literal(node) {
        return JSON.stringify(node.value)
    },
    BinaryExpression(node) {
        return `(${s(node.left)} ${node.operator} ${s(node.right)})`
    },
    UnaryExpression(node) {
        return `${node.operator}${s(node.argument)}`
    },
    MemberExpression(node) {
        if (ast.Identifier.is(node.property)) {
            return `${s(node.object)}.${s(node.property)}`
        }
        else {
            return `${s(node.object)}[${s(node.property)}]`
        }
    },
    CallExpression(node) {
        return `${s(node.callee)}(${node.arguments.map(s).join(', ')})`
    },
    VariableDeclaration(node) {
        return node.kind + " " + codeToString.Parameter!(node)
    },
    IfStatement(node) {
        let result =`(if ${s(node.test)} then ${s(node.consequent)}`
        if (node.alternate) {
            result += ` else ${s(node.alternate)} end`
        }
        else {
            result += ` end)`
        }
        return result
    },
    BlockStatement(node) {
        return `{ ${node.body.map(s).join('; ')} }`
    },
    ReturnStatement(node) {
        return `return ${toCodeString(node.argument)}`
    },
    SpreadElement(node) {
        return `...${toCodeString(node.argument)}`
    },
    RestElement(node) {
        return `...${toCodeString(node.argument)}`
    },
    RegularExpression(node) {
        return `/${node.pattern}/${node.flags}`
    }
}


const s = memoize(
    function (node: Node) {
        let fn = codeToString[node.constructor.name]
        if (fn == null) {
            throw new Error(`codeToString function not found for type: ${node.constructor.name}`)
        }
        return fn(node)
    }
)

export default function toCodeString(node: Node | null): string {
    if (node == null) {
        return "null"
    }
    return s(node)
}