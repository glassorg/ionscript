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
import * as Identifier from './Identifier';
import * as Expression from './Expression';
import * as Boolean from './ion/Boolean';
import * as Integer from './ion/Integer';
import * as Class from './ion/Class';
export class VariableDeclaration implements _Object.Object , Variable.Variable , Declaration.Declaration , Node.Node , Statement.Statement , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly id: Identifier.Identifier;
    readonly value: Expression.Expression | Null.Null;
    readonly assignable: Boolean.Boolean;
    readonly export: Integer.Integer;
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
        assignable = false,
        export: _export = 0
    }: {
        location?: Location.Location | Null.Null,
        id: Identifier.Identifier,
        value?: Expression.Expression | Null.Null,
        assignable?: Boolean.Boolean,
        export?: Integer.Integer
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Identifier.isIdentifier(id))
            throw new Error('id is not a Identifier: ' + Class.toString(id));
        if (!(Expression.isExpression(value) || Null.isNull(value)))
            throw new Error('value is not a Expression | Null: ' + Class.toString(value));
        if (!Boolean.isBoolean(assignable))
            throw new Error('assignable is not a Boolean: ' + Class.toString(assignable));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        this.location = location;
        this.id = id;
        this.value = value;
        this.assignable = assignable;
        this.export = _export;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Identifier.Identifier,
        value?: Expression.Expression | Null.Null,
        assignable?: Boolean.Boolean,
        export?: Integer.Integer
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