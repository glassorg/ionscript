import Type from "./Type"

function toTypeCheck(properties) {
    // if it's flags, it's OK.
    let allNumbers = true
    let set = new Set()
    for (let value of Object.values(properties)) {
        if (typeof value !== "number") {
            allNumbers = false
            break
        }
    }

    if (allNumbers) {
        return (value) => typeof value === "number"
    }

    return (value) => {
        return set.has(value)
    }
}

export default class Enum extends Type {

    constructor(name, properties) {
        super(toTypeCheck(properties), name)
        Object.assign(this, properties)
    }

}