/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Variable from './Variable';
import * as Declaration from './Declaration';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Type from './Type';
import * as Pattern from './Pattern';
import * as Expression from './Expression';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class Parameter implements _Object.Object , Variable.Variable , Declaration.Declaration , Typed.Typed , Node.Node , Statement.Statement , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | Null.Null;
    readonly id: Pattern.Pattern | Expression.Expression;
    readonly value: Expression.Expression | Null.Null;
    readonly export: Integer.Integer;
    static readonly id = 'Parameter';
    static readonly implements = new Set([
        'Parameter',
        'ion_Object',
        'Variable',
        'Declaration',
        'Typed',
        'Node',
        'Statement',
        'Exportable'
    ]);
    constructor({
        location = null,
        type = null,
        id,
        value = null,
        export: _export = 0
    }: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        id: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        export?: Integer.Integer
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || Null.isNull(type)))
            throw new Error('type is not a Type | Null: ' + Class.toString(type));
        if (!(Pattern.isPattern(id) || Expression.isExpression(id)))
            throw new Error('id is not a Pattern | Expression: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        this.location = location;
        this.type = type;
        this.id = id;
        this.value = value;
        this.export = _export;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        id?: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        export?: Integer.Integer
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