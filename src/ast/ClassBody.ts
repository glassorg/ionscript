/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as _Array from './ion/Array';
import * as MethodDefinition from './MethodDefinition';
import * as Class from './ion/Class';
export class ClassBody implements _Object.Object , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly body: _Array.Array<MethodDefinition.MethodDefinition>;
    static readonly id = 'ClassBody';
    static readonly implements = new Set([
        'ClassBody',
        'ion_Object',
        'Node'
    ]);
    constructor({location = null, body}: {
        location?: Location.Location | Null.Null,
        body: _Array.Array<MethodDefinition.MethodDefinition>
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!_Array.isArray(body))
            throw new Error('body is not a Array: ' + Class.toString(body));
        this.location = location;
        this.body = body;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        body?: _Array.Array<MethodDefinition.MethodDefinition>
    }) {
        return new ClassBody({
            ...this,
            ...properties
        });
    }
    static is(value): value is ClassBody {
        return isClassBody(value);
    }
}
export function isClassBody(value): value is ClassBody {
    return Class.isInstance(ClassBody, value);
}
export default ClassBody;