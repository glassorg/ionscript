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
import * as Type from './Type';
import * as Reference from './Reference';
import * as Class from './ion/Class';
export class Declarator implements _Object.Object , Identifier.Identifier , Pattern.Pattern , Node.Node , Typed.Typed {
    readonly location: Location.Location | Null.Null;
    readonly name: String.String;
    readonly type: Type.Type | (Reference.Reference | Null.Null);
    static readonly id = 'Declarator';
    static readonly implements = new Set([
        'Declarator',
        'ion_Object',
        'Identifier',
        'Pattern',
        'Node',
        'Typed'
    ]);
    constructor({location = null, name, type = null}: {
        location?: Location.Location | Null.Null,
        name: String.String,
        type?: Type.Type | (Reference.Reference | Null.Null)
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!String.isString(name))
            throw new Error('name is not a String: ' + Class.toString(name));
        if (!(Type.isType(type) || (Reference.isReference(type) || Null.isNull(type))))
            throw new Error('type is not a Type | Reference | Null: ' + Class.toString(type));
        this.location = location;
        this.name = name;
        this.type = type;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        name?: String.String,
        type?: Type.Type | (Reference.Reference | Null.Null)
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