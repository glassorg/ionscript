import * as symbols from "./symbols"

export default class Type {

    name: string
    is: (a, type) => boolean

    constructor(name: string, is: (a, type) => boolean) {
        this.name = name
        this.is = is
        this[symbols.is] = is
    }

    toString() {
        return name
    }

}