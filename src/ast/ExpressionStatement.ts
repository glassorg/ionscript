/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Statement from './Statement';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Expression from './Expression';
import * as Class from './ion/Class';
export class ExpressionStatement implements _Object.Object , Statement.Statement , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly expression: Expression.Expression;
    static readonly id = 'ExpressionStatement';
    static readonly implements = new Set([
        'ExpressionStatement',
        'ion_Object',
        'Statement',
        'Node'
    ]);
    constructor({location = null, expression}: {
        location?: Location.Location | Null.Null,
        expression: Expression.Expression
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Expression.isExpression(expression))
            throw new Error('expression is not a Expression: ' + Class.toString(expression));
        this.location = location;
        this.expression = expression;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        expression?: Expression.Expression
    }) {
        return new ExpressionStatement({
            ...this,
            ...properties
        });
    }
    static is(value): value is ExpressionStatement {
        return isExpressionStatement(value);
    }
}
export function isExpressionStatement(value): value is ExpressionStatement {
    return Class.isInstance(ExpressionStatement, value);
}
export default ExpressionStatement;