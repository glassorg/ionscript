/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Type from './Type';
import * as Expression from './Expression';
import * as Typed from './Typed';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Reference from './Reference';
import * as _Array from './ion/Array';
import * as Parameter from './Parameter';
import * as Boolean from './ion/Boolean';
import * as Class from './ion/Class';
export class FunctionType implements _Object.Object , Type.Type , Expression.Expression , Typed.Typed , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly type: Type.Type | (Reference.Reference | Null.Null);
    readonly params: _Array.Array<Parameter.Parameter>;
    readonly async: Boolean.Boolean;
    readonly returnType: Type.Type | (Reference.Reference | Null.Null);
    static readonly id = 'FunctionType';
    static readonly implements = new Set([
        'FunctionType',
        'ion_Object',
        'Type',
        'Expression',
        'Typed',
        'Node'
    ]);
    constructor({
        location = null,
        type = null,
        params,
        async: _async = false,
        returnType = null
    }: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | (Reference.Reference | Null.Null),
        params: _Array.Array<Parameter.Parameter>,
        async?: Boolean.Boolean,
        returnType?: Type.Type | (Reference.Reference | Null.Null)
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!(Type.isType(type) || (Reference.isReference(type) || Null.isNull(type))))
            throw new Error('type is not a Type | Reference | Null: ' + Class.toString(type));
        if (!_Array.isArray(params))
            throw new Error('params is not a Array: ' + Class.toString(params));
        if (!Boolean.isBoolean(_async))
            throw new Error('async is not a Boolean: ' + Class.toString(_async));
        if (!(Type.isType(returnType) || (Reference.isReference(returnType) || Null.isNull(returnType))))
            throw new Error('returnType is not a Type | Reference | Null: ' + Class.toString(returnType));
        this.location = location;
        this.type = type;
        this.params = params;
        this.async = _async;
        this.returnType = returnType;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        type?: Type.Type | (Reference.Reference | Null.Null),
        params?: _Array.Array<Parameter.Parameter>,
        async?: Boolean.Boolean,
        returnType?: Type.Type | (Reference.Reference | Null.Null)
    }) {
        return new FunctionType({
            ...this,
            ...properties
        });
    }
    static is(value): value is FunctionType {
        return isFunctionType(value);
    }
}
export function isFunctionType(value): value is FunctionType {
    return Class.isInstance(FunctionType, value);
}
export default FunctionType;