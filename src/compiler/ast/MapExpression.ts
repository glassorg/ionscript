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
import * as _Array from './ion/Array';
import * as Property from './Property';
import * as SpreadElement from './SpreadElement';
import * as Class from './ion/Class';
export class MapExpression implements _Object.Object , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly properties: _Array.Array<Property.Property | SpreadElement.SpreadElement>;
    static readonly id = 'MapExpression';
    static readonly implements = new Set([
        'MapExpression',
        'ion_Object',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        properties
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        properties: _Array.Array<Property.Property | SpreadElement.SpreadElement>
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!_Array.isArray(properties))
            throw new Error('properties is not a Array: ' + Class.toString(properties));
        this.location = location;
        this.export = _export;
        this.properties = properties;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        properties?: _Array.Array<Property.Property | SpreadElement.SpreadElement>
    }) {
        return new MapExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is MapExpression {
        return isMapExpression(value);
    }
}
export function isMapExpression(value): value is MapExpression {
    return Class.isInstance(MapExpression, value);
}
export default MapExpression;