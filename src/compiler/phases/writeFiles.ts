import { join, sep } from "path";
import { write } from "../common";
import { Options } from "../Compiler";

export default function writeFiles(output, options: Options) {
    for (let path of output.modules.keys()) {
        let content = output.modules.get(path) as string
        write(join(options.output, path.slice(path.indexOf(sep) + 1)), content)
    }
    return null
}