
export type Class = any & {
    id: string
    implements: string[]
}

export function isInstance(_class: Class, instance) {
    if (instance != null) {
        let _implements = instance.constructor.implements as Set<string> | undefined
        if (_implements) {
            return _implements.has(_class.id)
        }
    }
    return false
}

export function toString(value, b?: string[]) {
    let join = b == null
    if (b == null) {
        b = []
    }
    if (value === null) {
        b.push("null")
    }
    else if (value === undefined) {
        b.push("undefined")
    }
    else if (typeof value === "function") {
        b.push(`function ${value.name}`)
    }
    else if (typeof value === "object") {
        if (Array.isArray(value)) {
            b.push("[")
            for (let element of value) {
                toString(element, b)
            }
            b.push("]")
        }
        else {
            b.push(value.constructor.name)
            b.push("(")
            let count = 0
            for (let propertyName in value) {
                let propertyValue = value[propertyName]
                if (count++ > 0) {
                    b.push(",")
                }
                b.push(propertyName, ":")
                toString(propertyValue, b)
            }
            b.push(")")
        }
    }
    else {
        b.push(JSON.stringify(value))
    }
    return join ? b.join('') : null
}

export default Class