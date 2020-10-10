import { is } from "../symbols"

Object.defineProperties(RegExp.prototype, {
    [is]: {
        value(this: RegExp, a) {
            return a != null && this.test(a);
        }
    }
});
