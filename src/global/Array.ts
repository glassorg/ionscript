
import {is} from "../symbols"

function isTypedArray(value) {
    return value != null && value.buffer instanceof ArrayBuffer && value.byteLength > 0
}

Object.defineProperties(Array, {
    [is]: {
        value(a) {
            return Array.isArray(a) || isTypedArray(a);
        }
    }
});
