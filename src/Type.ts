import { is } from "./symbols"

export default class Type {

    is: (a, type) => boolean
    name: string

    constructor(is: (a, type) => boolean, name?: string) {
        this.is = is
        if (name == null) {
            name = is.name
            if (name == null) {
                name = ""
            }
            if (name.startsWith("is")) {
                name = name.slice(2)
            }
        }
        this.name = name
    }

    toString() {
        return name
    }

    static is(instance) {
        return instance != null && typeof (instance.is ?? instance[is]) === "function"
    }

}