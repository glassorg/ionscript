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
import * as Typed from './Typed';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Type from './Type';
import * as Integer from './ion/Integer';
import * as _Array from './ion/Array';
import * as Literal from './Literal';
import * as Identifier from './Identifier';
import * as String from './ion/String';
import * as Class from './ion/Class';
export type Specifier = ImportSpecifier.ImportSpecifier | (ImportDefaultSpecifier.ImportDefaultSpecifier | ImportNamespaceSpecifier.ImportNamespaceSpecifier);
export function isSpecifier(value): value is Specifier {
    return ImportSpecifier.isImportSpecifier(value) || (ImportDefaultSpecifier.isImportDefaultSpecifier(value) || ImportNamespaceSpecifier.isImportNamespaceSpecifier(value));
}
export class ImportDeclaration implements _Object.Object , Declaration.Declaration , Statement.Statement , Exportable.Exportable , Typed.Typed , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | Null.Null;
    readonly export: Integer.Integer;
    readonly specifiers: _Array.Array<Specifier | ImportDeclaration>;
    readonly path: _Array.Array<Literal.Literal | Identifier.Identifier> | Null.Null;
    readonly source: Literal.Literal;
    readonly absoluteSource: String.String | Null.Null;
    static readonly id = 'ImportDeclaration';
    static readonly implements = new Set([
        'ImportDeclaration',
        'ion_Object',
        'Declaration',
        'Statement',
        'Exportable',
        'Typed',
        'Node'
    ]);
    constructor({
        location = null,
        type = null,
        export: _export = 0,
        specifiers,
        path = null,
        source,
        absoluteSource = null
    }: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        export?: Integer.Integer,
        specifiers: _Array.Array<Specifier | ImportDeclaration>,
        path?: _Array.Array<Literal.Literal | Identifier.Identifier> | Null.Null,
        source: Literal.Literal,
        absoluteSource?: String.String | Null.Null
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || Null.isNull(type)))
            throw new Error('type is not a Type | Null: ' + Class.toString(type));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!_Array.isArray(specifiers))
            throw new Error('specifiers is not a Array: ' + Class.toString(specifiers));
        if (!(_Array.isArray(path) || Null.isNull(path)))
            throw new Error('path is not a Array | Null: ' + Class.toString(path));
        if (!Literal.isLiteral(source))
            throw new Error('source is not a Literal: ' + Class.toString(source));
        if (!(String.isString(absoluteSource) || Null.isNull(absoluteSource)))
            throw new Error('absoluteSource is not a String | Null: ' + Class.toString(absoluteSource));
        this.location = location;
        this.type = type;
        this.export = _export;
        this.specifiers = specifiers;
        this.path = path;
        this.source = source;
        this.absoluteSource = absoluteSource;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | Null.Null,
        export?: Integer.Integer,
        specifiers?: _Array.Array<Specifier | ImportDeclaration>,
        path?: _Array.Array<Literal.Literal | Identifier.Identifier> | Null.Null,
        source?: Literal.Literal,
        absoluteSource?: String.String | Null.Null
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