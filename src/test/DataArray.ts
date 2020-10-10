// import equals from "../internal/equals"
// import hashNumber, { hash } from "../internal/hashNumber"
// import * as symbols from "../symbols"

// export default class DataArray<T = any> extends Array<T> {

//     constructor(...args: T[]) {
//         super(...args)
//         // let value = 0x87374662
//         // for (let i = 0; i < args.length; i++) {
//         //     value = hash(value, hashNumber(args[i]))
//         // }
//         // this[symbols.hashNumber] = value
//     }

//     // get [symbols.hashValue]() {
//     //     return this[symbols.hashNumber]
//     // }

//     // [symbols.equals](a) {
//     //     if (a === this) {
//     //         return true
//     //     }
//     //     if (!DataArray.is(a) || a.length !== this.length) {
//     //         return false
//     //     }
//     //     // an array is only equal to another array if they are both immutable and have the same elements
//     //     if (a[symbols.hashNumber] !== this[symbols.hashNumber]) {
//     //         return false
//     //     }
//     //     for (let i = 0; i < this.length; i++) {
//     //         if (!equals(this[i], a[i])) {
//     //             return false
//     //         }
//     //     }
//     //     return true
//     // }

//     static is(a) {
//         return a != null && a.constructor === DataArray
//     }

// }