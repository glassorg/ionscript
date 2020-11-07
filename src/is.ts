import * as symbols from "./symbols"
import Type from "./Type";
import Null from "./Null";
import Undefined from "./Undefined";

export default function is(instance, type) {
    //  if the type has an is function we call it
    if (type !== null) {
        if (type[symbols.is]) {
            return type[symbols.is](instance)
        }
        if (typeof type.is === "function") {
            return type.is(instance)
        }
        if (typeof type === "function") {
            return instance instanceof type
        }
    }
    return instance === type
}