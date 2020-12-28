import { is } from "./symbols"

export default class Type {

    name: string
    is: (a, type) => boolean

    constructor(name: string, is: (a, type) => boolean) {
        this.name = name
        this.is = is
    }

    toString() {
        return name
    }

    static is(instance) {
        return instance != null && typeof (instance.is ?? instance[is]) === "function"
    }

}