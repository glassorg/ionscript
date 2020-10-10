
import {is} from "../symbols";

Object.defineProperties(Array, {
    [is]: {
        value(a) {
            return Array.isArray(a);
        }
    }
});
