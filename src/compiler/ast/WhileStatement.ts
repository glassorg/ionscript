/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as LoopStatement from './LoopStatement';
import * as Statement from './Statement';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Type from './Type';
import * as Expression from './Expression';
import * as BlockStatement from './BlockStatement';
import * as Class from './ion/Class';
export class WhileStatement implements _Object.Object , LoopStatement.LoopStatement , Statement.Statement , Typed.Typed , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | Null.Null;
    readonly test: Expression.Expression;
    readonly body: BlockStatement.BlockStatement;
    static readonly id = 'WhileStatement';
    static readonly implements = new Set([
        'WhileStatement',
        'ion_Object',
        'LoopStatement',
        'Statement',
        'Typed',
        'Node'
    ]);
    constructor({location = null, type = null, test, body}: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        test: Expression.Expression,
        body: BlockStatement.BlockStatement
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || Null.isNull(type)))
            throw new Error('type is not a Type | Null: ' + Class.toString(type));
        if (!Expression.isExpression(test))
            throw new Error('test is not a Expression: ' + Class.toString(test));
        if (!BlockStatement.isBlockStatement(body))
            throw new Error('body is not a BlockStatement: ' + Class.toString(body));
        this.location = location;
        this.type = type;
        this.test = test;
        this.body = body;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        test?: Expression.Expression,
        body?: BlockStatement.BlockStatement
    }) {
        return new WhileStatement({
            ...this,
            ...properties
        });
    }
    static is(value): value is WhileStatement {
        return isWhileStatement(value);
    }
}
export function isWhileStatement(value): value is WhileStatement {
    return Class.isInstance(WhileStatement, value);
}
export default WhileStatement;