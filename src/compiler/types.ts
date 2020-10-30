import Reference from "./ast/Reference";
import { getGlobalPath } from "./pathFunctions";

function ref(name: string) {
    return new Reference({ name, path: getGlobalPath(name) })
}

export const Boolean = ref("Boolean")
export const String = ref("String")
export const Number = ref("Number")
export const Integer = ref("Integer")
export const Array = ref("Array")
export const Map = ref("Map")
export const Set = ref("Set")
export const Class = ref("Class")
export const Function = ref("Function")
export const Type = ref("Type")
export const Object = ref("Object")
export const Null = ref("Null")
export const Any = ref("Any")
export const Never = ref("Never")
export const Undefined = ref("Undefined")
export const Symbol = ref("Symbol")
export const RegExp = ref("RegExp")
export const WeakMap = ref("WeakMap")

// export const EmptyLocation = new Location({ start: new Position(0, 0), end: new Position(0, 0), filename: "inferType.empty" })

function equals(a, b: Reference) {
    return a === b || Reference.is(a) && a.name === b.name
}

export function isAny(node): node is Reference {
    return equals(node, Any)
}

export function isNever(node): node is Reference {
    return equals(node, Never)
}
