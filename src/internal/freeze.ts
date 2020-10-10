// import * as symbols from "../symbols";
// import hashNumber, { hash } from "./hashNumber";
// import isFrozen from "./isFrozen";
// import { debug } from "./options";

// export default function freeze(object) {
//     if (object == null || isFrozen(object)) {
//         return object
//     }
//     if (Array.isArray(object)) {
//         // we will always just-in-time precalculate
//         // also, double
//         let value = 0x87374662
//         for (let i = 0; i < object.length; i++) {
//             let item = object[i]
//             if (!isFrozen(item)) {
//                 throw new Error("Cannot freeze an array with unfrozen items")
//             }
//             value = hash(value, hashNumber(item))
//         }
//         object[symbols.hashNumber] = value
//     }
//     if (debug) {
//         return Object.freeze(object)
//     }
//     object[symbols.frozen] = true
//     return object
// }
