/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Variable from './Variable';
import * as Declaration from './Declaration';
import * as Node from './Node';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Pattern from './Pattern';
import * as Expression from './Expression';
import * as Integer from './ion/Integer';
import * as String from './ion/String';
import * as Class from './ion/Class';
export class VariableDeclaration implements _Object.Object , Variable.Variable , Declaration.Declaration , Node.Node , Statement.Statement , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly id: Pattern.Pattern;
    readonly value: Expression.Expression | Null.Null;
    readonly export: Integer.Integer;
    readonly kind: String.String;
    static readonly id = 'VariableDeclaration';
    static readonly implements = new Set([
        'VariableDeclaration',
        'ion_Object',
        'Variable',
        'Declaration',
        'Node',
        'Statement',
        'Exportable'
    ]);
    constructor({
        location = null,
        id,
        value = null,
        export: _export = 0,
        kind
    }: {
        location?: Location.Location | Null.Null,
        id: Pattern.Pattern,
        value?: Expression.Expression | Null.Null,
        export?: Integer.Integer,
        kind: String.String
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Pattern.isPattern(id))
            throw new Error('id is not a Pattern: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!String.isString(kind))
            throw new Error('kind is not a String: ' + Class.toString(kind));
        this.location = location;
        this.id = id;
        this.value = value;
        this.export = _export;
        this.kind = kind;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Pattern.Pattern,
        value?: Expression.Expression | Null.Null,
        export?: Integer.Integer,
        kind?: String.String
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