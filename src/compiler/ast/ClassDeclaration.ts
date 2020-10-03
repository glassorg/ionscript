/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Declaration from './Declaration';
import * as Statement from './Statement';
import * as Exportable from './Exportable';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Integer from './ion/Integer';
import * as Boolean from './ion/Boolean';
import * as Identifier from './Identifier';
import * as _Array from './ion/Array';
import * as Parameter from './Parameter';
import * as Reference from './Reference';
import * as VariableDeclaration from './VariableDeclaration';
import * as InstanceDeclarations from './InstanceDeclarations';
import * as Class from './ion/Class';
export class ClassDeclaration implements _Object.Object , Declaration.Declaration , Statement.Statement , Exportable.Exportable , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly export: Integer.Integer;
    readonly isStruct: Boolean.Boolean;
    readonly id: Identifier.Identifier;
    readonly parameters: _Array.Array<Parameter.Parameter>;
    readonly baseClasses: _Array.Array<Reference.Reference>;
    readonly static: _Array.Array<VariableDeclaration.VariableDeclaration>;
    readonly instance: InstanceDeclarations.InstanceDeclarations;
    static readonly id = 'ClassDeclaration';
    static readonly implements = new Set([
        'ClassDeclaration',
        'ion_Object',
        'Declaration',
        'Statement',
        'Exportable',
        'Node'
    ]);
    constructor({
        location = null,
        export: _export = 0,
        isStruct = false,
        id,
        parameters = [],
        baseClasses = [],
        static: _static,
        instance
    }: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        isStruct?: Boolean.Boolean,
        id: Identifier.Identifier,
        parameters?: _Array.Array<Parameter.Parameter>,
        baseClasses?: _Array.Array<Reference.Reference>,
        static: _Array.Array<VariableDeclaration.VariableDeclaration>,
        instance: InstanceDeclarations.InstanceDeclarations
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Integer.isInteger(_export))
            throw new Error('export is not a Integer: ' + Class.toString(_export));
        if (!Boolean.isBoolean(isStruct))
            throw new Error('isStruct is not a Boolean: ' + Class.toString(isStruct));
        if (!Identifier.isIdentifier(id))
            throw new Error('id is not a Identifier: ' + Class.toString(id));
        if (!_Array.isArray(parameters))
            throw new Error('parameters is not a Array: ' + Class.toString(parameters));
        if (!_Array.isArray(baseClasses))
            throw new Error('baseClasses is not a Array: ' + Class.toString(baseClasses));
        if (!_Array.isArray(_static))
            throw new Error('static is not a Array: ' + Class.toString(_static));
        if (!InstanceDeclarations.isInstanceDeclarations(instance))
            throw new Error('instance is not a InstanceDeclarations: ' + Class.toString(instance));
        this.location = location;
        this.export = _export;
        this.isStruct = isStruct;
        this.id = id;
        this.parameters = parameters;
        this.baseClasses = baseClasses;
        this.static = _static;
        this.instance = instance;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        export?: Integer.Integer,
        isStruct?: Boolean.Boolean,
        id?: Identifier.Identifier,
        parameters?: _Array.Array<Parameter.Parameter>,
        baseClasses?: _Array.Array<Reference.Reference>,
        static?: _Array.Array<VariableDeclaration.VariableDeclaration>,
        instance?: InstanceDeclarations.InstanceDeclarations
    }) {
        return new ClassDeclaration({
            ...this,
            ...properties
        });
    }
    static is(value): value is ClassDeclaration {
        return isClassDeclaration(value);
    }
}
export function isClassDeclaration(value): value is ClassDeclaration {
    return Class.isInstance(ClassDeclaration, value);
}
export default ClassDeclaration;