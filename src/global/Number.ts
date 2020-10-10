import { is } from "../symbols";

Object.defineProperties(Number, {
    [is]: {
        value(a) {
            return typeof a === "number";
        }
    }
});
