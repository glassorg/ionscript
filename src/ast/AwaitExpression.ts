/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Expression from './Expression';
import * as Node from './Node';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class AwaitExpression implements _Object.Object , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly argument: Expression.Expression;
    static readonly id = 'AwaitExpression';
    static readonly implements = new Set([
        'AwaitExpression',
        'ion_Object',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        argument
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        argument: Expression.Expression
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!Expression.isExpression(argument))
            throw new Error('argument is not a Expression: ' + Class.toString(argument));
        this.location = location;
        this.export = _export;
        this.argument = argument;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        argument?: Expression.Expression
    }) {
        return new AwaitExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is AwaitExpression {
        return isAwaitExpression(value);
    }
}
export function isAwaitExpression(value): value is AwaitExpression {
    return Class.isInstance(AwaitExpression, value);
}
export default AwaitExpression;