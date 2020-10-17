/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as VariableDeclaration from './VariableDeclaration';
import * as Variable from './Variable';
import * as Declaration from './Declaration';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Type from './Type';
import * as Reference from './Reference';
import * as Pattern from './Pattern';
import * as Expression from './Expression';
import * as Integer from './ion/Integer';
import * as String from './ion/String';
import * as Identifier from './Identifier';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class ConditionalDeclaration implements _Object.Object , VariableDeclaration.VariableDeclaration , Variable.Variable , Declaration.Declaration , Typed.Typed , Node.Node , Statement.Statement , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | (Reference.Reference | Null.Null);
    readonly id: Pattern.Pattern | Expression.Expression;
    readonly value: Expression.Expression | Null.Null;
    readonly export: Integer.Integer;
    readonly kind: String.String;
    readonly static: Identifier.Identifier | Null.Null;
    readonly instance: Boolean.Boolean;
    readonly negate: Boolean.Boolean;
    static readonly id = 'ConditionalDeclaration';
    static readonly implements = new Set([
        'ConditionalDeclaration',
        'ion_Object',
        'VariableDeclaration',
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
        export: _export = 0,
        kind,
        static: _static = null,
        instance = false,
        negate = false
    }: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | (Reference.Reference | Null.Null),
        id: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        export?: Integer.Integer,
        kind: String.String,
        static?: Identifier.Identifier | Null.Null,
        instance?: Boolean.Boolean,
        negate?: Boolean.Boolean
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || (Reference.isReference(type) || Null.isNull(type))))
            throw new Error('type is not a Type | Reference | Null: ' + Class.toString(type));
        if (!(Pattern.isPattern(id) || Expression.isExpression(id)))
            throw new Error('id is not a Pattern | Expression: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!String.isString(kind))
            throw new Error('kind is not a String: ' + Class.toString(kind));
        if (!(Identifier.isIdentifier(_static) || Null.isNull(_static)))
            throw new Error('static is not a Identifier | Null: ' + Class.toString(_static));
        if (!Boolean.isBoolean(instance))
            throw new Error('instance is not a Boolean: ' + Class.toString(instance));
        if (!Boolean.isBoolean(negate))
            throw new Error('negate is not a Boolean: ' + Class.toString(negate));
        this.location = location;
        this.type = type;
        this.id = id;
        this.value = value;
        this.export = _export;
        this.kind = kind;
        this.static = _static;
        this.instance = instance;
        this.negate = negate;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | (Reference.Reference | Null.Null),
        id?: Pattern.Pattern | Expression.Expression,
        value?: Expression.Expression | Null.Null,
        export?: Integer.Integer,
        kind?: String.String,
        static?: Identifier.Identifier | Null.Null,
        instance?: Boolean.Boolean,
        negate?: Boolean.Boolean
    }) {
        return new ConditionalDeclaration({
            ...this,
            ...properties
        });
    }
    static is(value): value is ConditionalDeclaration {
        return isConditionalDeclaration(value);
    }
}
export function isConditionalDeclaration(value): value is ConditionalDeclaration {
    return Class.isInstance(ConditionalDeclaration, value);
}
export default ConditionalDeclaration;