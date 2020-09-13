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
import * as Identifier from './Identifier';
import * as _Array from './ion/Array';
import * as Parameter from './Parameter';
import * as BlockStatement from './BlockStatement';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class FunctionExpression implements _Object.Object , Expression.Expression , Scope.Scope , Node.Node , Exportable.Exportable {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly id: Identifier.Identifier | Null.Null;
    readonly params: _Array.Array<Parameter.Parameter>;
    readonly body: BlockStatement.BlockStatement;
    readonly async: Boolean.Boolean;
    readonly generator: Boolean.Boolean;
    static readonly id = 'FunctionExpression';
    static readonly implements = new Set([
        'FunctionExpression',
        'ion_Object',
        'Expression',
        'Scope',
        'Node',
        'Exportable'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        id = null,
        params,
        body,
        async: _async = false,
        generator = false
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        id?: Identifier.Identifier | Null.Null,
        params: _Array.Array<Parameter.Parameter>,
        body: BlockStatement.BlockStatement,
        async?: Boolean.Boolean,
        generator?: Boolean.Boolean
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!(Identifier.isIdentifier(id) || Null.isNull(id)))
            throw new Error('id is not a Identifier | Null: ' + Class.toString(id));
        if (!_Array.isArray(params))
            throw new Error('params is not a Array: ' + Class.toString(params));
        if (!BlockStatement.isBlockStatement(body))
            throw new Error('body is not a BlockStatement: ' + Class.toString(body));
        if (!Boolean.isBoolean(_async))
            throw new Error('async is not a Boolean: ' + Class.toString(_async));
        if (!Boolean.isBoolean(generator))
            throw new Error('generator is not a Boolean: ' + Class.toString(generator));
        this.location = location;
        this.export = _export;
        this.id = id;
        this.params = params;
        this.body = body;
        this.async = _async;
        this.generator = generator;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        id?: Identifier.Identifier | Null.Null,
        params?: _Array.Array<Parameter.Parameter>,
        body?: BlockStatement.BlockStatement,
        async?: Boolean.Boolean,
        generator?: Boolean.Boolean
    }) {
        return new FunctionExpression({
            ...this,
            ...properties
        });
    }
    static is(value): value is FunctionExpression {
        return isFunctionExpression(value);
    }
}
export function isFunctionExpression(value): value is FunctionExpression {
    return Class.isInstance(FunctionExpression, value);
}
export default FunctionExpression;