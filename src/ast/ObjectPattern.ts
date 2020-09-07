/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Pattern from './Pattern';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as _Array from './ion/Array';
import * as Property from './Property';
import * as RestElement from './RestElement';
import * as Class from './ion/Class';
export class ObjectPattern implements _Object.Object , Pattern.Pattern , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly properties: _Array.Array<Property.Property | RestElement.RestElement>;
    static readonly id = 'ObjectPattern';
    static readonly implements = new Set([
        'ObjectPattern',
        'ion_Object',
        'Pattern',
        'Node'
    ]);
    constructor({location = null, properties}: {
        location?: Location.Location | Null.Null,
        properties: _Array.Array<Property.Property | RestElement.RestElement>
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!_Array.isArray(properties))
            throw new Error('properties is not a Array: ' + Class.toString(properties));
        this.location = location;
        this.properties = properties;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        properties?: _Array.Array<Property.Property | RestElement.RestElement>
    }) {
        return new ObjectPattern({
            ...this,
            ...properties
        });
    }
    static is(value): value is ObjectPattern {
        return isObjectPattern(value);
    }
}
export function isObjectPattern(value): value is ObjectPattern {
    return Class.isInstance(ObjectPattern, value);
}
export default ObjectPattern;