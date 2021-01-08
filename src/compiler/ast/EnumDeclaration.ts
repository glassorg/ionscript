/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Declaration from './Declaration';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Type from './Type';
import * as Integer from './ion/Integer';
import * as Boolean from './ion/Boolean';
import * as Declarator from './Declarator';
import * as _Array from './ion/Array';
import * as Property from './Property';
import * as Class from './ion/Class';
export class EnumDeclaration implements _Object.Object , Declaration.Declaration , Statement.Statement , Exportable.Exportable , Typed.Typed , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | Null.Null;
    readonly export: Integer.Integer;
    readonly flags: Boolean.Boolean;
    readonly id: Declarator.Declarator;
    readonly properties: _Array.Array<Property.Property>;
    static readonly id = 'EnumDeclaration';
    static readonly implements = new Set([
        'EnumDeclaration',
        'ion_Object',
        'Declaration',
        'Statement',
        'Exportable',
        'Typed',
        'Node'
    ]);
    constructor({
        location = null,
        type = null,
        export: _export = 0,
        flags = false,
        id,
        properties
    }: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        export?: Integer.Integer,
        flags?: Boolean.Boolean,
        id: Declarator.Declarator,
        properties: _Array.Array<Property.Property>
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || Null.isNull(type)))
            throw new Error('type is not a Type | Null: ' + Class.toString(type));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!Boolean.isBoolean(flags))
            throw new Error('flags is not a Boolean: ' + Class.toString(flags));
        if (!Declarator.isDeclarator(id))
            throw new Error('id is not a Declarator: ' + Class.toString(id));
        if (!_Array.isArray(properties))
            throw new Error('properties is not a Array: ' + Class.toString(properties));
        this.location = location;
        this.type = type;
        this.export = _export;
        this.flags = flags;
        this.id = id;
        this.properties = properties;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        export?: Integer.Integer,
        flags?: Boolean.Boolean,
        id?: Declarator.Declarator,
        properties?: _Array.Array<Property.Property>
    }) {
        return new EnumDeclaration({
            ...this,
            ...properties
        });
    }
    static is(value): value is EnumDeclaration {
        return isEnumDeclaration(value);
    }
}
export function isEnumDeclaration(value): value is EnumDeclaration {
    return Class.isInstance(EnumDeclaration, value);
}
export default EnumDeclaration;