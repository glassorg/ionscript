/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as ModuleSpecifier from './ModuleSpecifier';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Identifier from './Identifier';
import * as Class from './ion/Class';
export class ImportDefaultSpecifier implements _Object.Object , ModuleSpecifier.ModuleSpecifier , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly local: Identifier.Identifier;
    static readonly id = 'ImportDefaultSpecifier';
    static readonly implements = new Set([
        'ImportDefaultSpecifier',
        'ion_Object',
        'ModuleSpecifier',
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
        return new ImportDefaultSpecifier({
            ...this,
            ...properties
        });
    }
    static is(value): value is ImportDefaultSpecifier {
        return isImportDefaultSpecifier(value);
    }
}
export function isImportDefaultSpecifier(value): value is ImportDefaultSpecifier {
    return Class.isInstance(ImportDefaultSpecifier, value);
}
export default ImportDefaultSpecifier;