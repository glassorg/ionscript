import * as HtmlLogger from "./HtmlLogger";
import * as common from "./common";
import defaultPhases, { fast } from "./phases";
import Parser = require("./parser");
import watchDirectory from "./watchDirectory";

type Logger = (names?: string | string[], ast?: any) => void
const NullLogger = () => {}

export class Options {

    inputs: string[]
    output: string
    namespace: string
    parser!: ReturnType<typeof Parser>
    debug: boolean

    constructor(
        inputs: string[],
        output: string,
        namespace: string = common.findPackage()?.name ?? "_compiling_",
        debug = true,
    ) {
        this.namespace= namespace
        this.inputs = inputs
        this.output = output
        this.debug = debug
    }

}

export default class Compiler {

    logger: Logger

    constructor(logger: Logger = HtmlLogger.create("./output.html")) {
        this.logger = logger
    }

    watch(options: Options) {
        //  first compile normal
        this.compile(options)
        //  then watch files for changes
        for (let input of options.inputs) {
            watchDirectory(input, {}, (filename, previous, current, change) => {
                //  incrementally recompile just this file
                let start = Date.now()
                let content = common.read(filename)
                let path = common.getPathFromFilename(options.namespace, filename.slice(input.length + 1))
                // console.log({ filename, change, path, content })
                //  we *really* should also kickoff a full recompile in a separate thread
                //  or maybe the fast compile should be in the other thread
                this.compile(options, { [path]: content }, defaultPhases, NullLogger)
                let stop = Date.now()
                let time = stop - start
                console.log(`${filename} => ${time}ms`)
            })
        }
    }

    compile(options: Options, files?: { [path: string]: string }, phases = defaultPhases, logger = this.logger) {
        options.parser = Parser()
        if (files == null) {
            files = common.getInputFilesRecursive(options.inputs, options.namespace)
        }
        let root: any = files
        logger("Input", root)
        let lastPhase
        try {
            for (let phase of phases) {
                lastPhase = phase
                root = phase(root, options) || root
                logger(phase.name, root)
            }
            logger("Output", root)
            logger()
        }
        catch (e) {
            console.log(lastPhase?.name)
            logger()
            let location = e.location
            if (location == null || location.start == null) {
                console.log(e.message)
            }
            else {
                let { filename } = location
                let source = files[filename]!
                let error = options.parser.getError(e.message, location, source, filename)
                console.log(error.message)
            }
        }
        return root
    }

}