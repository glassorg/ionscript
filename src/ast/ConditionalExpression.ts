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
import * as Class from './ion/Class';
export class ConditionalExpression implements _Object.Object , Expression.Expression , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly test: Expression.Expression;
    readonly consequent: Expression.Expression;
    readonly alternate: Expression.Expression;
    static readonly id = 'ConditionalExpression';
    static readonly implements = new Set([
        'ConditionalExpression',
        'ion_Object',
        'Expression',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        test,
        consequent,
        alternate
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        test: Expression.Expression,
        consequent: Expression.Expression,
        alternate: Expression.Expression
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!Expression.isExpression(test))
            throw new Error('test is not a Expression: ' + Class.toString(test));
        if (!Expression.isExpression(consequent))
            throw new Error('consequent is not a Expression: ' + Class.toString(consequent));
        if (!Expression.isExpression(alternate))
            throw new Error('alternate is not a Expression: ' + Class.toString(alternate));
        this.location = location;
        this.export = _export;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        test?: Expression.Expression,
        consequent?: Expression.Expression,
        alternate?: Expression.Expression
    }) {
        return new ConditionalExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is ConditionalExpression {
        return isConditionalExpression(value);
    }
}
export function isConditionalExpression(value): value is ConditionalExpression {
    return Class.isInstance(ConditionalExpression, value);
}
export default ConditionalExpression;