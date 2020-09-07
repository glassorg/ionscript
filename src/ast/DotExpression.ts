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
export class DotExpression implements _Object.Object , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    static readonly id = 'DotExpression';
    static readonly implements = new Set([
        'DotExpression',
        'ion_Object',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        this.location = location;
        this.export = _export;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer
    }) {
        return new DotExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is DotExpression {
        return isDotExpression(value);
    }
}
export function isDotExpression(value): value is DotExpression {
    return Class.isInstance(DotExpression, value);
}
export default DotExpression;