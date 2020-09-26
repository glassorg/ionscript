import * as HtmlLogger from "./HtmlLogger";
import * as common from "./common";
import phases from "./phases";
import Parser = require("./parser");

type Logger = (names?: string | string[], ast?: any) => void

export class Options {

    inputs: string[]
    output: string
    namespace: string
    parser!: ReturnType<typeof Parser>

    constructor(
        inputs: string[],
        output: string,
        namespace: string = common.findPackage()?.name ?? "_compiling_"
    ) {
        this.namespace= namespace
        this.inputs = inputs
        this.output = output
    }

}

export default class Compiler {

    logger: Logger

    constructor(logger: Logger = HtmlLogger.create("./output.html")) {
        this.logger = logger
    }

    compile(options: Options, files?: { [path: string]: string }) {
        options.parser = Parser()
        if (files == null) {
            files = common.getInputFilesRecursive(options.inputs, options.namespace)
        }
        let root: any = files
        this.logger("Input", root)
        try {
            for (let phase of phases) {
                console.log(phase.name)
                root = phase(root, options) || root
                this.logger(phase.name, root)
            }
            this.logger("Output", root)
            this.logger()
        }
        catch (e) {
            this.logger()
            let location = e.location
            if (location == null || location.start == null) {
                throw e
            }
            let { filename } = location
            let source = files[filename]!
            let error = options.parser.getError(e.message, location, source, filename)
            console.log(error.message)
        }
        return root
    }

}