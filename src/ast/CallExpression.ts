/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Expression from './Expression';
import * as ChainElement from './ChainElement';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Boolean from './ion/Boolean';
import * as _Array from './ion/Array';
import * as Class from './ion/Class';
export class CallExpression implements _Object.Object , Expression.Expression , ChainElement.ChainElement , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly optional: Boolean.Boolean;
    readonly callee: Expression.Expression;
    readonly arguments: _Array.Array<Expression.Expression>;
    static readonly id = 'CallExpression';
    static readonly implements = new Set([
        'CallExpression',
        'ion_Object',
        'Expression',
        'ChainElement',
        'Node'
    ]);
    constructor({
        location = null,
        optional = false,
        callee,
        arguments: _arguments
    }: {
        location?: Location.Location | Null.Null,
        optional?: Boolean.Boolean,
        callee: Expression.Expression,
        arguments: _Array.Array<Expression.Expression>
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Boolean.isBoolean(optional))
            throw new Error('optional is not a Boolean: ' + Class.toString(optional));
        if (!Expression.isExpression(callee))
            throw new Error('callee is not a Expression: ' + Class.toString(callee));
        if (!_Array.isArray(_arguments))
            throw new Error('arguments is not a Array: ' + Class.toString(_arguments));
        this.location = location;
        this.optional = optional;
        this.callee = callee;
        this.arguments = _arguments;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        optional?: Boolean.Boolean,
        callee?: Expression.Expression,
        arguments?: _Array.Array<Expression.Expression>
    }) {
        return new CallExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is CallExpression {
        return isCallExpression(value);
    }
}
export function isCallExpression(value): value is CallExpression {
    return Class.isInstance(CallExpression, value);
}
export default CallExpression;