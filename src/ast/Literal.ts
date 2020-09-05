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
import * as String from './ion/String';
import * as Number from './ion/Number';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class Literal implements _Object.Object , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly value: String.String | (Number.Number | (Boolean.Boolean | Null.Null));
    static readonly id = 'Literal';
    static readonly implements = new Set([
        'Literal',
        'ion_Object',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        value
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        value: String.String | (Number.Number | (Boolean.Boolean | Null.Null))
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!(String.isString(value) || (Number.isNumber(value) || (Boolean.isBoolean(value) || Null.isNull(value)))))
            throw new Error('value is not a String | Number | Boolean | Null: ' + Class.toString(value));
        this.location = location;
        this.export = _export;
        this.value = value;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        value?: String.String | (Number.Number | (Boolean.Boolean | Null.Null))
    }) {
        return new Literal({
            ...this,
            ...properties
        });
    }
    static is(value): value is Literal {
        return isLiteral(value);
    }
}
export function isLiteral(value): value is Literal {
    return Class.isInstance(Literal, value);
}
export default Literal;