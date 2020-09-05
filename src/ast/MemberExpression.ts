/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Expression from './Expression';
import * as ChainElement from './ChainElement';
import * as Node from './Node';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as Boolean from './ion/Boolean';
import * as Identifier from './Identifier';
import * as Class from './ion/Class';
export class MemberExpression implements _Object.Object , Expression.Expression , ChainElement.ChainElement , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly optional: Boolean.Boolean;
    readonly object: Expression.Expression;
    readonly property: Identifier.Identifier | Expression.Expression;
    static readonly id = 'MemberExpression';
    static readonly implements = new Set([
        'MemberExpression',
        'ion_Object',
        'Expression',
        'ChainElement',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        optional = false,
        object,
        property
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        optional?: Boolean.Boolean,
        object: Expression.Expression,
        property: Identifier.Identifier | Expression.Expression
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!Boolean.isBoolean(optional))
            throw new Error('optional is not a Boolean: ' + Class.toString(optional));
        if (!Expression.isExpression(object))
            throw new Error('object is not a Expression: ' + Class.toString(object));
        if (!(Identifier.isIdentifier(property) || Expression.isExpression(property)))
            throw new Error('property is not a Identifier | Expression: ' + Class.toString(property));
        this.location = location;
        this.export = _export;
        this.optional = optional;
        this.object = object;
        this.property = property;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        optional?: Boolean.Boolean,
        object?: Expression.Expression,
        property?: Identifier.Identifier | Expression.Expression
    }) {
        return new MemberExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is MemberExpression {
        return isMemberExpression(value);
    }
}
export function isMemberExpression(value): value is MemberExpression {
    return Class.isInstance(MemberExpression, value);
}
export default MemberExpression;