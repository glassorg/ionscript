/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Identifier from './Identifier';
import * as Pattern from './Pattern';
import * as Node from './Node';
import * as Typed from './Typed';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as String from './ion/String';
import * as _Array from './ion/Array';
import * as Type from './Type';
import * as Class from './ion/Class';
export class Declarator implements _Object.Object , Identifier.Identifier , Pattern.Pattern , Node.Node , Typed.Typed {
    readonly location: Location.Location | Null.Null;
    readonly name: String.String;
    readonly path: String.String | Null.Null;
    readonly arguments: _Array.Array<Type.Type> | Null.Null;
    readonly type: Type.Type | Null.Null;
    static readonly id = 'Declarator';
    static readonly implements = new Set([
        'Declarator',
        'ion_Object',
        'Identifier',
        'Pattern',
        'Node',
        'Typed'
    ]);
    constructor({
        location = null,
        name,
        path = null,
        arguments: _arguments = null,
        type = null
    }: {
        location?: Location.Location | Null.Null,
        name: String.String,
        path?: String.String | Null.Null,
        arguments?: _Array.Array<Type.Type> | Null.Null,
        type?: Type.Type | Null.Null
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!String.isString(name))
            throw new Error('name is not a String: ' + Class.toString(name));
        if (!(String.isString(path) || Null.isNull(path)))
            throw new Error('path is not a String | Null: ' + Class.toString(path));
        if (!(_Array.isArray(_arguments) || Null.isNull(_arguments)))
            throw new Error('arguments is not a Array | Null: ' + Class.toString(_arguments));
        if (!(Type.isType(type) || Null.isNull(type)))
            throw new Error('type is not a Type | Null: ' + Class.toString(type));
        this.location = location;
        this.name = name;
        this.path = path;
        this.arguments = _arguments;
        this.type = type;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        name?: String.String,
        path?: String.String | Null.Null,
        arguments?: _Array.Array<Type.Type> | Null.Null,
        type?: Type.Type | Null.Null
    }) {
        return new Declarator({
            ...this,
            ...properties
        });
    }
    static is(value): value is Declarator {
        return isDeclarator(value);
    }
}
export function isDeclarator(value): value is Declarator {
    return Class.isInstance(Declarator, value);
}
export default Declarator;