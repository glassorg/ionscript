/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Expression from './Expression';
import * as Node from './Node';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as _Array from './ion/Array';
import * as SpreadElement from './SpreadElement';
import * as Statement from './Statement';
import * as String from './ion/String';
import * as Class from './ion/Class';
export class OutlineOperation implements _Object.Object , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly operands: _Array.Array<Expression.Expression | (SpreadElement.SpreadElement | (Statement.Statement | Null.Null))>;
    readonly operator: String.String;
    static readonly id = 'OutlineOperation';
    static readonly implements = new Set([
        'OutlineOperation',
        'ion_Object',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        operands,
        operator
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        operands: _Array.Array<Expression.Expression | (SpreadElement.SpreadElement | (Statement.Statement | Null.Null))>,
        operator: String.String
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!_Array.isArray(operands))
            throw new Error('operands is not a Array: ' + Class.toString(operands));
        if (!String.isString(operator))
            throw new Error('operator is not a String: ' + Class.toString(operator));
        this.location = location;
        this.export = _export;
        this.operands = operands;
        this.operator = operator;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        operands?: _Array.Array<Expression.Expression | (SpreadElement.SpreadElement | (Statement.Statement | Null.Null))>,
        operator?: String.String
    }) {
        return new OutlineOperation({
            ...this,
            ...properties
        });
    }
    static is(value): value is OutlineOperation {
        return isOutlineOperation(value);
    }
}
export function isOutlineOperation(value): value is OutlineOperation {
    return Class.isInstance(OutlineOperation, value);
}
export default OutlineOperation;