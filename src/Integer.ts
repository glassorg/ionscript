
import Type from "./Type";

export default new Type("Integer", a => typeof a === "number" && Math.floor(a) === a)
