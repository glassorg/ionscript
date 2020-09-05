/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Variable from './Variable';
import * as Declaration from './Declaration';
import * as Statement from './Statement';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Identifier from './Identifier';
import * as Expression from './Expression';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class Parameter implements _Object.Object , Variable.Variable , Declaration.Declaration , Statement.Statement , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly id: Identifier.Identifier;
    readonly value: Expression.Expression | Null.Null;
    readonly assignable: Boolean.Boolean;
    static readonly id = 'Parameter';
    static readonly implements = new Set([
        'Parameter',
        'ion_Object',
        'Variable',
        'Declaration',
        'Statement',
        'Node'
    ]);
    constructor({location = null, id, value = null, assignable = false}: {
        location?: Location.Location | Null.Null,
        id: Identifier.Identifier,
        value?: Expression.Expression | Null.Null,
        assignable?: Boolean.Boolean
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Identifier.isIdentifier(id))
            throw new Error('id is not a Identifier: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!Boolean.isBoolean(assignable))
            throw new Error('assignable is not a Boolean: ' + Class.toString(assignable));
        this.location = location;
        this.id = id;
        this.value = value;
        this.assignable = assignable;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Identifier.Identifier,
        value?: Expression.Expression | Null.Null,
        assignable?: Boolean.Boolean
    }) {
        return new Parameter({
            ...this,
            ...properties
        });
    }
    static is(value): value is Parameter {
        return isParameter(value);
    }
}
export function isParameter(value): value is Parameter {
    return Class.isInstance(Parameter, value);
}
export default Parameter;