import {is} from "../symbols";

Object.defineProperties(Object, {
    [is]: {
        value(a) {
            return a != null && !Array.isArray(a) && typeof a === "object";
        }
    },
});

Object.defineProperties(Object.prototype, {
    [Symbol.iterator]: {
        *value() {
            for (let name in this) {
                let value = this[name]
                yield [name, value]
            }
        },
        configurable: true,
    }
})
