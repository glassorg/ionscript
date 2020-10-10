// import * as symbols from "../symbols"

// export default function equals(a, b): boolean {
//     if (a === b) {
//         return true
//     }
//     if (a == null || b == null) {
//         return false
//     }
//     if (typeof a !== typeof b) {
//         return false
//     }
//     if (a.constructor !== b.constructor) {
//         return false
//     }
//     return a[symbols.equals](b)
// }