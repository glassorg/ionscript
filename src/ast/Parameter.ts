/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Variable from './Variable';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Pattern from './Pattern';
import * as Expression from './Expression';
import * as Class from './ion/Class';
export class Parameter implements _Object.Object , Variable.Variable , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly id: Pattern.Pattern;
    readonly value: Expression.Expression | Null.Null;
    static readonly id = 'Parameter';
    static readonly implements = new Set([
        'Parameter',
        'ion_Object',
        'Variable',
        'Node'
    ]);
    constructor({location = null, id, value = null}: {
        location?: Location.Location | Null.Null,
        id: Pattern.Pattern,
        value?: Expression.Expression | Null.Null
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Pattern.isPattern(id))
            throw new Error('id is not a Pattern: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        this.location = location;
        this.id = id;
        this.value = value;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Pattern.Pattern,
        value?: Expression.Expression | Null.Null
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