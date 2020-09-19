/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Boolean from './ion/Boolean';
import * as String from './ion/String';
import * as Class from './ion/Class';
export class TemplateElement implements _Object.Object , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly tail: Boolean.Boolean;
    readonly cooked: String.String;
    readonly raw: String.String;
    static readonly id = 'TemplateElement';
    static readonly implements = new Set([
        'TemplateElement',
        'ion_Object',
        'Node'
    ]);
    constructor({location = null, tail = false, cooked, raw}: {
        location?: Location.Location | Null.Null,
        tail?: Boolean.Boolean,
        cooked: String.String,
        raw: String.String
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Boolean.isBoolean(tail))
            throw new Error('tail is not a Boolean: ' + Class.toString(tail));
        if (!String.isString(cooked))
            throw new Error('cooked is not a String: ' + Class.toString(cooked));
        if (!String.isString(raw))
            throw new Error('raw is not a String: ' + Class.toString(raw));
        this.location = location;
        this.tail = tail;
        this.cooked = cooked;
        this.raw = raw;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        tail?: Boolean.Boolean,
        cooked?: String.String,
        raw?: String.String
    }) {
        return new TemplateElement({
            ...this,
            ...properties
        });
    }
    static is(value): value is TemplateElement {
        return isTemplateElement(value);
    }
}
export function isTemplateElement(value): value is TemplateElement {
    return Class.isInstance(TemplateElement, value);
}
export default TemplateElement;