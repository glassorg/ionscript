/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Literal from './Literal';
import * as Identifier from './Identifier';
import * as Expression from './Expression';
import * as String from './ion/String';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class Property implements _Object.Object , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly key: Literal.Literal | Identifier.Identifier;
    readonly value: Expression.Expression;
    readonly kind: String.String;
    readonly method: Boolean.Boolean;
    readonly shorthand: Boolean.Boolean;
    readonly computed: Boolean.Boolean;
    static readonly id = 'Property';
    static readonly implements = new Set([
        'Property',
        'ion_Object',
        'Node'
    ]);
    constructor({location = null, key, value, kind = 'init', method = false, shorthand = false, computed = false}: {
        location?: Location.Location | Null.Null,
        key: Literal.Literal | Identifier.Identifier,
        value: Expression.Expression,
        kind?: String.String,
        method?: Boolean.Boolean,
        shorthand?: Boolean.Boolean,
        computed?: Boolean.Boolean
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Literal.isLiteral(key) || Identifier.isIdentifier(key)))
            throw new Error('key is not a Literal | Identifier: ' + Class.toString(key));
        if (!Expression.isExpression(value))
            throw new Error('value is not a Expression: ' + Class.toString(value));
        if (!String.isString(kind))
            throw new Error('kind is not a String: ' + Class.toString(kind));
        if (!Boolean.isBoolean(method))
            throw new Error('method is not a Boolean: ' + Class.toString(method));
        if (!Boolean.isBoolean(shorthand))
            throw new Error('shorthand is not a Boolean: ' + Class.toString(shorthand));
        if (!Boolean.isBoolean(computed))
            throw new Error('computed is not a Boolean: ' + Class.toString(computed));
        this.location = location;
        this.key = key;
        this.value = value;
        this.kind = kind;
        this.method = method;
        this.shorthand = shorthand;
        this.computed = computed;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        key?: Literal.Literal | Identifier.Identifier,
        value?: Expression.Expression,
        kind?: String.String,
        method?: Boolean.Boolean,
        shorthand?: Boolean.Boolean,
        computed?: Boolean.Boolean
    }) {
        return new Property({
            ...this,
            ...properties
        });
    }
    static is(value): value is Property {
        return isProperty(value);
    }
}
export function isProperty(value): value is Property {
    return Class.isInstance(Property, value);
}
export default Property;