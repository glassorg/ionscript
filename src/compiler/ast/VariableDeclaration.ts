/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Variable from './Variable';
import * as Typed from './Typed';
import * as Declaration from './Declaration';
import * as Node from './Node';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Pattern from './Pattern';
import * as Expression from './Expression';
import * as Type from './Type';
import * as Reference from './Reference';
import * as Integer from './ion/Integer';
import * as String from './ion/String';
import * as Identifier from './Identifier';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class VariableDeclaration implements _Object.Object , Variable.Variable , Typed.Typed , Declaration.Declaration , Node.Node , Statement.Statement , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly id: Pattern.Pattern | Expression.Expression;
    readonly value: Expression.Expression | Null.Null;
    readonly type: Type.Type | (Reference.Reference | (Expression.Expression | Null.Null));
    readonly export: Integer.Integer;
    readonly kind: String.String;
    readonly static: Identifier.Identifier | Null.Null;
    readonly instance: Boolean.Boolean;
    static readonly id = 'VariableDeclaration';
    static readonly implements = new Set([
        'VariableDeclaration',
        'ion_Object',
        'Variable',
        'Typed',
        'Declaration',
        'Node',
        'Statement',
        'Exportable'
    ]);
    constructor({
        location = null,
        id,
        value = null,
        type = null,
        export: _export = 0,
        kind,
        static: _static = null,
        instance = false
    }: {
        location?: Location.Location | Null.Null,
        id: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        type?: Type.Type | (Reference.Reference | (Expression.Expression | Null.Null)),
        export?: Integer.Integer,
        kind: String.String,
        static?: Identifier.Identifier | Null.Null,
        instance?: Boolean.Boolean
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Pattern.isPattern(id) || Expression.isExpression(id)))
            throw new Error('id is not a Pattern | Expression: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!(Type.isType(type) || (Reference.isReference(type) || (Expression.isExpression(type) || Null.isNull(type)))))
            throw new Error('type is not a Type | Reference | Expression | Null: ' + Class.toString(type));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!String.isString(kind))
            throw new Error('kind is not a String: ' + Class.toString(kind));
        if (!(Identifier.isIdentifier(_static) || Null.isNull(_static)))
            throw new Error('static is not a Identifier | Null: ' + Class.toString(_static));
        if (!Boolean.isBoolean(instance))
            throw new Error('instance is not a Boolean: ' + Class.toString(instance));
        this.location = location;
        this.id = id;
        this.value = value;
        this.type = type;
        this.export = _export;
        this.kind = kind;
        this.static = _static;
        this.instance = instance;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        type?: Type.Type | (Reference.Reference | (Expression.Expression | Null.Null)),
        export?: Integer.Integer,
        kind?: String.String,
        static?: Identifier.Identifier | Null.Null,
        instance?: Boolean.Boolean
    }) {
        return new VariableDeclaration({
            ...this,
            ...properties
        });
    }
    static is(value): value is VariableDeclaration {
        return isVariableDeclaration(value);
    }
}
export function isVariableDeclaration(value): value is VariableDeclaration {
    return Class.isInstance(VariableDeclaration, value);
}
export default VariableDeclaration;