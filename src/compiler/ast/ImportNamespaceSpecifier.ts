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
export class ImportNamespaceSpecifier implements _Object.Object , ModuleSpecifier.ModuleSpecifier , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly local: Identifier.Identifier;
    static readonly id = 'ImportNamespaceSpecifier';
    static readonly implements = new Set([
        'ImportNamespaceSpecifier',
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
        return new ImportNamespaceSpecifier({
            ...this,
            ...properties
        });
    }
    static is(value): value is ImportNamespaceSpecifier {
        return isImportNamespaceSpecifier(value);
    }
}
export function isImportNamespaceSpecifier(value): value is ImportNamespaceSpecifier {
    return Class.isInstance(ImportNamespaceSpecifier, value);
}
export default ImportNamespaceSpecifier;