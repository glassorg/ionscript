// import { frozen } from "../symbols";
// import { isPrimitive } from "./isPrimitive";
// import { debug } from "./options";

// export default function isFrozen(object) {
//     if (isPrimitive(object)) {
//         return true
//     }
//     if (debug) {
//         return Object.isFrozen(object)
//     }
//     return object[frozen] === true
// }