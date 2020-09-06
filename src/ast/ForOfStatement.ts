/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as ForStatement from './ForStatement';
import * as Statement from './Statement';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as VariableDeclaration from './VariableDeclaration';
import * as Expression from './Expression';
import * as BlockStatement from './BlockStatement';
import * as Class from './ion/Class';
export class ForOfStatement implements _Object.Object , ForStatement.ForStatement , Statement.Statement , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly left: VariableDeclaration.VariableDeclaration;
    readonly right: Expression.Expression;
    readonly body: BlockStatement.BlockStatement;
    static readonly id = 'ForOfStatement';
    static readonly implements = new Set([
        'ForOfStatement',
        'ion_Object',
        'ForStatement',
        'Statement',
        'Node'
    ]);
    constructor({location = null, left, right, body}: {
        location?: Location.Location | Null.Null,
        left: VariableDeclaration.VariableDeclaration,
        right: Expression.Expression,
        body: BlockStatement.BlockStatement
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!VariableDeclaration.isVariableDeclaration(left))
            throw new Error('left is not a VariableDeclaration: ' + Class.toString(left));
        if (!Expression.isExpression(right))
            throw new Error('right is not a Expression: ' + Class.toString(right));
        if (!BlockStatement.isBlockStatement(body))
            throw new Error('body is not a BlockStatement: ' + Class.toString(body));
        this.location = location;
        this.left = left;
        this.right = right;
        this.body = body;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        left?: VariableDeclaration.VariableDeclaration,
        right?: Expression.Expression,
        body?: BlockStatement.BlockStatement
    }) {
        return new ForOfStatement({
            ...this,
            ...properties
        });
    }
    static is(value): value is ForOfStatement {
        return isForOfStatement(value);
    }
}
export function isForOfStatement(value): value is ForOfStatement {
    return Class.isInstance(ForOfStatement, value);
}
export default ForOfStatement;