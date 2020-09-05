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
export class ReturnStatement implements _Object.Object , Statement.Statement , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly argument: Expression.Expression;
    static readonly id = 'ReturnStatement';
    static readonly implements = new Set([
        'ReturnStatement',
        'ion_Object',
        'Statement',
        'Node'
    ]);
    constructor({location = null, argument}: {
        location?: Location.Location | Null.Null,
        argument: Expression.Expression
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Expression.isExpression(argument))
            throw new Error('argument is not a Expression: ' + Class.toString(argument));
        this.location = location;
        this.argument = argument;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        argument?: Expression.Expression
    }) {
        return new ReturnStatement({
            ...this,
            ...properties
        });
    }
    static is(value): value is ReturnStatement {
        return isReturnStatement(value);
    }
}
export function isReturnStatement(value): value is ReturnStatement {
    return Class.isInstance(ReturnStatement, value);
}
export default ReturnStatement;