import Property from "./Property"
import is from "./is"

let writableProperties = Symbol("ionscript.Data.writableProperties")
function getWritableProperties(object): Map<string,Property> {
    let wprops = object.constructor[writableProperties]
    if (wprops == null) {
        // initialize this objects constructor since this is the first time.
        Object.defineProperties(object.constructor.prototype, Object.fromEntries(object.constructor.prototype.properties))
        // store the writable properties
        wprops = object.constructor[writableProperties]
            = new Map(
                Array.from(object.constructor.prototype.properties as Map<string,Property>).filter(([name, property]) => property.writable)
            )
    }
    return wprops
}

export default class Data {

    constructor(properties) {
        if (properties == null) {
            throw new Error("properties arguments is required")
        }
        for (let [name, prop] of getWritableProperties(this)) {
            let value = properties[name]
            // only check at debug time?
            if (prop.type) {
                if (value === undefined) {
                    if (prop.value === undefined) {
                        throw new Error(`${name} property is required`)
                    }
                    value = prop.value
                }
                else if (!is(value, prop.type)) {
                    throw new Error(`${name} property is not a valid ${prop.type.name || prop.type}: ${value}`)
                }
            }
            this[name] = value
        }
    }

    toJSON() {
        return { "": this.constructor.name, ...this }
    }

    static coerce(properties) {
        return new this(properties)
    }

    //  validate
    //  hashValue
    //  equals

}
