/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Statement from './Statement';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Type from './Type';
import * as Reference from './Reference';
import * as VariableDeclaration from './VariableDeclaration';
import * as Expression from './Expression';
import * as BlockStatement from './BlockStatement';
import * as Class from './ion/Class';
export class ForStatement implements _Object.Object , Statement.Statement , Typed.Typed , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | (Reference.Reference | Null.Null);
    readonly left: VariableDeclaration.VariableDeclaration;
    readonly right: Expression.Expression;
    readonly body: BlockStatement.BlockStatement;
    static readonly id = 'ForStatement';
    static readonly implements = new Set([
        'ForStatement',
        'ion_Object',
        'Statement',
        'Typed',
        'Node'
    ]);
    constructor({location = null, type = null, left, right, body}: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | (Reference.Reference | Null.Null),
        left: VariableDeclaration.VariableDeclaration,
        right: Expression.Expression,
        body: BlockStatement.BlockStatement
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || (Reference.isReference(type) || Null.isNull(type))))
            throw new Error('type is not a Type | Reference | Null: ' + Class.toString(type));
        if (!VariableDeclaration.isVariableDeclaration(left))
            throw new Error('left is not a VariableDeclaration: ' + Class.toString(left));
        if (!Expression.isExpression(right))
            throw new Error('right is not a Expression: ' + Class.toString(right));
        if (!BlockStatement.isBlockStatement(body))
            throw new Error('body is not a BlockStatement: ' + Class.toString(body));
        this.location = location;
        this.type = type;
        this.left = left;
        this.right = right;
        this.body = body;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | (Reference.Reference | Null.Null),
        left?: VariableDeclaration.VariableDeclaration,
        right?: Expression.Expression,
        body?: BlockStatement.BlockStatement
    }) {
        return new ForStatement({
            ...this,
            ...properties
        });
    }
    static is(value): value is ForStatement {
        return isForStatement(value);
    }
}
export function isForStatement(value): value is ForStatement {
    return Class.isInstance(ForStatement, value);
}
export default ForStatement;