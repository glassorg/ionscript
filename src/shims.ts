
Object.defineProperties(Number, {
    is: {
        value(a) {
            return typeof a === "number";
        }
    }
});

Object.defineProperties(String, {
    is: {
        value(a) {
            return typeof a === "string";
        }
    }
});

Object.defineProperties(Boolean, {
    is: {
        value(a) {
            return typeof a === "boolean";
        }
    }
});

Object.defineProperties(Function, {
    is: {
        value(a) {
            return typeof a === "function";
        }
    }
});

Object.defineProperties(Array, {
    is: {
        value(a) {
            return Array.isArray(a);
        }
    }
});

Object.defineProperties(Object, {
    is: {
        value(a) {
            return a != null && !Array.isArray(a) && typeof a === "object";
        }
    }
});

Object.defineProperties(RegExp.prototype, {
    is: {
        value(this: RegExp, a) {
            return a != null && this.test(a);
        }
    }
});
