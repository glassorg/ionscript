// import { memoizeIntern } from "../compiler/common"
// import * as symbols from "../symbols"
// import isFrozen from "./isFrozen"

// function hashString(a: string) {
//     let value = 0x8ae7723fc
//     for (let i = 0; i < a.length; i++) {
//         value = hash(value, a.charCodeAt(i))
//     }
//     return value
// }

// const hashStringIntern = memoizeIntern(hashString)

// export function hash(a: number, b: number) {
//     let hash = ((a << 5) - a) + b
//     return hash & hash
// }

// export default function hashNumber(object): number {
//     if (object === null) {
//         return 0x2311FCAB
//     }
//     if (object === undefined) {
//         return 0x98EFABED
//     }
//     if (object === true) {
//         return 0x11110000
//     }
//     if (object === false) {
//         return 0x01020304
//     }
//     let type = typeof object
//     if (type === "string") {
//         //  for strings we use a quick hash code which is likely to collide frequently
//         //  we can balance this later
//         return hash(
//             hash(0x44870ef6, object.length),
//             hash(object.charCodeAt(0), object.charCodeAt(object.length - 1))
//         )
//     }
//     if (type === "number") {
//         return hash(0x722536de, object)
//     }
//     let value = object[symbols.hashNumber]
//     if (!(typeof value === "number")) {
//         value = hash(0x9be8d45a, hashStringIntern(object.constructor.name))
//     }
//     return value
// }