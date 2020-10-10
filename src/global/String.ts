import { is } from "../symbols"

Object.defineProperties(String, {
    [is]: {
        value(a) {
            return typeof a === "string";
        }
    }
});
