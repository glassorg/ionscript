/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Variable from './Variable';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Pattern from './Pattern';
import * as Expression from './Expression';
import * as Type from './Type';
import * as Reference from './Reference';
import * as Class from './ion/Class';
export class Parameter implements _Object.Object , Variable.Variable , Typed.Typed , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly id: Pattern.Pattern | Expression.Expression;
    readonly value: Expression.Expression | Null.Null;
    readonly type: Type.Type | (Reference.Reference | (Expression.Expression | Null.Null));
    static readonly id = 'Parameter';
    static readonly implements = new Set([
        'Parameter',
        'ion_Object',
        'Variable',
        'Typed',
        'Node'
    ]);
    constructor({location = null, id, value = null, type = null}: {
        location?: Location.Location | Null.Null,
        id: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        type?: Type.Type | (Reference.Reference | (Expression.Expression | Null.Null))
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Pattern.isPattern(id) || Expression.isExpression(id)))
            throw new Error('id is not a Pattern | Expression: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!(Type.isType(type) || (Reference.isReference(type) || (Expression.isExpression(type) || Null.isNull(type)))))
            throw new Error('type is not a Type | Reference | Expression | Null: ' + Class.toString(type));
        this.location = location;
        this.id = id;
        this.value = value;
        this.type = type;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        type?: Type.Type | (Reference.Reference | (Expression.Expression | Null.Null))
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