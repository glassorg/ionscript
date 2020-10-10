import {is} from "../symbols";

Object.defineProperties(Object, {
    [is]: {
        value(a) {
            return a != null && !Array.isArray(a) && typeof a === "object";
        }
    }
});
