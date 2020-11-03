import { Expression, Reference, BinaryExpression, DotExpression, TypeExpression, Type, FunctionType } from "../ast";
import simplify from "./simplify";

export function normalizeExpressions(node: Expression) {
    if (TypeExpression.is(node)) {
        node = node.value
    }
    if (Reference.is(node)) {
        return new BinaryExpression({
            location: node.location,
            left: new DotExpression({}),
            operator: "is",
            right: node
        })
    }
    return node
}

export function simplifyType(type: Type) {
    if (Expression.is(type)) {
        type = simplify(type)
    }
    if (TypeExpression.is(type)) {
        let { value } = type
        if (BinaryExpression.is(value) && DotExpression.is(value.left) && value.operator === "is" && (Reference.is(value.right) || FunctionType.is(value.right))) {
            return value.right
        }
    }
    return type
}

export default function and(left: Expression, right: Expression): Expression | null {
    left = simplify(normalizeExpressions(left))
    right = simplify(normalizeExpressions(right))
    if (left == null) {
        return right
    }
    if (right == null) {
        return left
    }
    return simplify(new BinaryExpression({ left, operator: "&&", right }))
}