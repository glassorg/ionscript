/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class Expression implements _Object.Object , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    static readonly id = 'Expression';
    static readonly implements = new Set([
        'Expression',
        'ion_Object',
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
        return new Expression({
            ...this,
            ...properties
        });
    }
    static is(value): value is Expression {
        return isExpression(value);
    }
}
export function isExpression(value): value is Expression {
    return Class.isInstance(Expression, value);
}
export default Expression;