/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Identifier from './Identifier';
import * as Class from './ion/Class';
export class ModuleSpecifier implements _Object.Object , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly local: Identifier.Identifier;
    static readonly id = 'ModuleSpecifier';
    static readonly implements = new Set([
        'ModuleSpecifier',
        'ion_Object',
        'Node'
    ]);
    constructor({location = null, local}: {
        location?: Location.Location | Null.Null,
        local: Identifier.Identifier
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Identifier.isIdentifier(local))
            throw new Error('local is not a Identifier: ' + Class.toString(local));
        this.location = location;
        this.local = local;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        local?: Identifier.Identifier
    }) {
        return new ModuleSpecifier({
            ...this,
            ...properties
        });
    }
    static is(value): value is ModuleSpecifier {
        return isModuleSpecifier(value);
    }
}
export function isModuleSpecifier(value): value is ModuleSpecifier {
    return Class.isInstance(ModuleSpecifier, value);
}
export default ModuleSpecifier;