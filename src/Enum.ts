import Type from "./Type"

function toTypeCheck(properties) {
    let set = new Set(Object.values(properties))
    return (value) => set.has(value)
}

export default class Enum extends Type {

    constructor(name, properties) {
        super(toTypeCheck(properties), name)
        Object.assign(this, properties)
    }

}