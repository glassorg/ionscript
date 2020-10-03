/*
This file was generated from ion source. Do not edit.
*/
import * as _Object from './ion/Object';
import * as Pattern from './Pattern';
import * as Node from './Node';
import * as Location from './Location';
import * as Null from './ion/Null';
import * as Declarator from './Declarator';
import * as Class from './ion/Class';
export class RestElement implements _Object.Object , Pattern.Pattern , Node.Node {
    readonly location: Location.Location | Null.Null;
    readonly argument: Declarator.Declarator;
    static readonly id = 'RestElement';
    static readonly implements = new Set([
        'RestElement',
        'ion_Object',
        'Pattern',
        'Node'
    ]);
    constructor({location = null, argument}: {
        location?: Location.Location | Null.Null,
        argument: Declarator.Declarator
    }) {
        if (!(Location.isLocation(location) || Null.isNull(location)))
            throw new Error('location is not a Location | Null: ' + Class.toString(location));
        if (!Declarator.isDeclarator(argument))
            throw new Error('argument is not a Declarator: ' + Class.toString(argument));
        this.location = location;
        this.argument = argument;
        Object.freeze(this);
    }
    patch(properties: {
        location?: Location.Location | Null.Null,
        argument?: Declarator.Declarator
    }) {
        return new RestElement({
            ...this,
            ...properties
        });
    }
    static is(value): value is RestElement {
        return isRestElement(value);
    }
}
export function isRestElement(value): value is RestElement {
    return Class.isInstance(RestElement, value);
}
export default RestElement;