/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class Exportable implements _Object.Object , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    static readonly id = 'Exportable';
    static readonly implements = new Set([
        'Exportable',
        'ion_Object',
        'Node'
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
        return new Exportable({
            ...this,
            ...properties
        });
    }
    static is(value): value is Exportable {
        return isExportable(value);
    }
}
export function isExportable(value): value is Exportable {
    return Class.isInstance(Exportable, value);
}
export default Exportable;