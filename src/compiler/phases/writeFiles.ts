import { join } from "path";
import { write } from "../common";
import { Options } from "../Compiler";
import Assembly from "../ast/Assembly";

const extension = ".js"
export default function writeFiles(output, options: Options) {
    for (let path of output.modules.keys()) {
        let content = output.modules.get(path) as string
        write(join(options.output, path) + extension, content)
    }
    return null
}