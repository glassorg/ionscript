/*
This file was generated from ion source. Do not edit.
*/
import * as ImportSpecifier from './ImportSpecifier';
import * as ImportDefaultSpecifier from './ImportDefaultSpecifier';
import * as ImportNamespaceSpecifier from './ImportNamespaceSpecifier';
import * as _Object from './ion/Object';
import * as Declaration from './Declaration';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as _Array from './ion/Array';
import * as Literal from './Literal';
import * as Class from './ion/Class';
export type Specifier = ImportSpecifier.ImportSpecifier | (ImportDefaultSpecifier.ImportDefaultSpecifier | ImportNamespaceSpecifier.ImportNamespaceSpecifier);
export function isSpecifier(value): value is Specifier {
    return ImportSpecifier.isImportSpecifier(value) || (ImportDefaultSpecifier.isImportDefaultSpecifier(value) || ImportNamespaceSpecifier.isImportNamespaceSpecifier(value));
}
export class ImportDeclaration implements _Object.Object , Declaration.Declaration , Statement.Statement , Exportable.Exportable , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly specifiers: _Array.Array<Specifier>;
    readonly source: Literal.Literal;
    static readonly id = 'ImportDeclaration';
    static readonly implements = new Set([
        'ImportDeclaration',
        'ion_Object',
        'Declaration',
        'Statement',
        'Exportable',
        'Node'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        specifiers,
        source
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        specifiers: _Array.Array<Specifier>,
        source: Literal.Literal
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!_Array.isArray(specifiers))
            throw new Error('specifiers is not a Array: ' + Class.toString(specifiers));
        if (!Literal.isLiteral(source))
            throw new Error('source is not a Literal: ' + Class.toString(source));
        this.location = location;
        this.export = _export;
        this.specifiers = specifiers;
        this.source = source;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        specifiers?: _Array.Array<Specifier>,
        source?: Literal.Literal
    }) {
        return new ImportDeclaration({
            ...this,
            ...properties
        });
    }
    static is(value): value is ImportDeclaration {
        return isImportDeclaration(value);
    }
}
export function isImportDeclaration(value): value is ImportDeclaration {
    return Class.isInstance(ImportDeclaration, value);
}
export default ImportDeclaration;