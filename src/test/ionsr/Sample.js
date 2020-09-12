import {
    a,
    b
} from 'foo/bar/baz';
import {
    x,
    y
} from '../../Foo';
const x = foo?.bar[12 + 5]?.baz?.('foo', true, x);
const value = function (x = 0, y = 0) {
    return new Vector(1, 2);
};
const identity = function (a, b) {
    switch (a) {
    case 1:
    case 2:
    case 3:
        return 10;
    case 2:
        return 20;
    case 3:
        return 30;
    default:
        return 55;
    }
};
class Vector {
    constructor() {
        super();
    }
    translate(dx = 0, dy = 0) {
        return new Vector(x + dx, y + dy);
    }
    get foo() {
        return 12;
    }
    set foo() {
        return 12;
    }
}
Object.defineProperties(Vector.prototype, {
    bar: {
        get: function () {
            return 12;
        },
        set: function (value) {
        }
    }
});
const foo = [
    a,
    b,
    ...bar,
    c,
    d
];
const bar = {
    a,
    x: y,
    ...fuz,
    ...huh
};
const outline = {
    x,
    y,
    z,
    ...foo,
    x: 10,
    y: 20
};
const matrix = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
];