import {is} from "../symbols"

Object.defineProperties(Function, {
    [is]: {
        value(a) {
            return typeof a === "function";
        }
    }
});
