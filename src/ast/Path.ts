/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as _Array from './ion/Array';
import * as Identifier from './Identifier';
import * as Number from './ion/Number';
import * as Class from './ion/Class';
export class Path implements _Object.Object , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly steps: _Array.Array<Identifier.Identifier>;
    readonly relative: Number.Number;
    static readonly id = 'Path';
    static readonly implements = new Set([
        'Path',
        'ion_Object',
        'Node'
    ]);
    constructor({location = null, steps, relative = 0}: {
        location?: Location.Location | Null.Null,
        steps: _Array.Array<Identifier.Identifier>,
        relative?: Number.Number
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!_Array.isArray(steps))
            throw new Error('steps is not a Array: ' + Class.toString(steps));
        if (!Number.isNumber(relative))
            throw new Error('relative is not a Number: ' + Class.toString(relative));
        this.location = location;
        this.steps = steps;
        this.relative = relative;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        steps?: _Array.Array<Identifier.Identifier>,
        relative?: Number.Number
    }) {
        return new Path({
            ...this,
            ...properties
        });
    }
    static is(value): value is Path {
        return isPath(value);
    }
}
export function isPath(value): value is Path {
    return Class.isInstance(Path, value);
}
export default Path;