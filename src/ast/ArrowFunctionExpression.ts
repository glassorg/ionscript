/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Expression from './Expression';
import * as Scope from './Scope';
import * as Node from './Node';
import * as Exportable from './Exportable';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as _Array from './ion/Array';
import * as Parameter from './Parameter';
import * as BlockStatement from './BlockStatement';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class ArrowFunctionExpression implements _Object.Object , Expression.Expression , Scope.Scope , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly params: _Array.Array<Parameter.Parameter>;
    readonly body: BlockStatement.BlockStatement | Expression.Expression;
    readonly expression: Boolean.Boolean;
    static readonly id = 'ArrowFunctionExpression';
    static readonly implements = new Set([
        'ArrowFunctionExpression',
        'ion_Object',
        'Expression',
        'Scope',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        params,
        body,
        expression
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        params: _Array.Array<Parameter.Parameter>,
        body: BlockStatement.BlockStatement | Expression.Expression,
        expression: Boolean.Boolean
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!_Array.isArray(params))
            throw new Error('params is not a Array: ' + Class.toString(params));
        if (!(BlockStatement.isBlockStatement(body) || Expression.isExpression(body)))
            throw new Error('body is not a BlockStatement | Expression: ' + Class.toString(body));
        if (!Boolean.isBoolean(expression))
            throw new Error('expression is not a Boolean: ' + Class.toString(expression));
        this.location = location;
        this.export = _export;
        this.params = params;
        this.body = body;
        this.expression = expression;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        params?: _Array.Array<Parameter.Parameter>,
        body?: BlockStatement.BlockStatement | Expression.Expression,
        expression?: Boolean.Boolean
    }) {
        return new ArrowFunctionExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is ArrowFunctionExpression {
        return isArrowFunctionExpression(value);
    }
}
export function isArrowFunctionExpression(value): value is ArrowFunctionExpression {
    return Class.isInstance(ArrowFunctionExpression, value);
}
export default ArrowFunctionExpression;