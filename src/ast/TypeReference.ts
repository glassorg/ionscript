/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Reference from './Reference';
import * as Type from './Type';
import * as Identifier from './Identifier';
import * as Expression from './Expression';
import * as Node from './Node';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as String from './ion/String';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class TypeReference implements _Object.Object , Reference.Reference , Type.Type , Identifier.Identifier , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly name: String.String;
    readonly export: Integer.Integer;
    static readonly id = 'TypeReference';
    static readonly implements = new Set([
        'TypeReference',
        'ion_Object',
        'Reference',
        'Type',
        'Identifier',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        name,
        export: _export = 0
    }: {
        location?: Location.Location | Null.Null,
        name: String.String,
        export?: Integer.Integer
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!String.isString(name))
            throw new Error('name is not a String: ' + Class.toString(name));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        this.location = location;
        this.name = name;
        this.export = _export;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        name?: String.String,
        export?: Integer.Integer
    }) {
        return new TypeReference({
            ...this,
            ...properties
        });
    }
    static is(value): value is TypeReference {
        return isTypeReference(value);
    }
}
export function isTypeReference(value): value is TypeReference {
    return Class.isInstance(TypeReference, value);
}
export default TypeReference;