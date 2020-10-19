/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Scope from './Scope';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Declarator from './Declarator';
import * as _Array from './ion/Array';
import * as Statement from './Statement';
import * as Class from './ion/Class';
export class Program implements _Object.Object , Scope.Scope , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly id: Declarator.Declarator;
    readonly body: _Array.Array<Statement.Statement>;
    static readonly id = 'Program';
    static readonly implements = new Set([
        'Program',
        'ion_Object',
        'Scope',
        'Node'
    ]);
    constructor({location = null, id, body}: {
        location?: Location.Location | Null.Null,
        id: Declarator.Declarator,
        body: _Array.Array<Statement.Statement>
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Declarator.isDeclarator(id))
            throw new Error('id is not a Declarator: ' + Class.toString(id));
        if (!_Array.isArray(body))
            throw new Error('body is not a Array: ' + Class.toString(body));
        this.location = location;
        this.id = id;
        this.body = body;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        id?: Declarator.Declarator,
        body?: _Array.Array<Statement.Statement>
    }) {
        return new Program({
            ...this,
            ...properties
        });
    }
    static is(value): value is Program {
        return isProgram(value);
    }
}
export function isProgram(value): value is Program {
    return Class.isInstance(Program, value);
}
export default Program;