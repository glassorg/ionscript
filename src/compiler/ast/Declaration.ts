/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class Declaration implements _Object.Object , Statement.Statement , Exportable.Exportable , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    static readonly id = 'Declaration';
    static readonly implements = new Set([
        'Declaration',
        'ion_Object',
        'Statement',
        'Exportable',
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
        return new Declaration({
            ...this,
            ...properties
        });
    }
    static is(value): value is Declaration {
        return isDeclaration(value);
    }
}
export function isDeclaration(value): value is Declaration {
    return Class.isInstance(Declaration, value);
}
export default Declaration;