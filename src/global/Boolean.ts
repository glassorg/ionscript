import { is } from "../symbols";

Object.defineProperties(Boolean, {
    [is]: {
        value(a) {
            return typeof a === "boolean";
        }
    }
});
