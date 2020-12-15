import * as HtmlLogger from "./HtmlLogger";
import * as common from "./common";
import defaultPhases, { noEmit } from "./phases";
// we need the path to lib so the code works in normal compile and in parcel
import Parser = require("../../lib/compiler/parser");
import watchDirectory from "./watchDirectory";
import toModuleFiles, { moduleExtension } from "./phases/toModuleFiles";

type Logger = (names?: string | string[], ast?: any) => void
const NullLogger = () => {}

export class Options {

    inputs: string[]
    output: string
    namespace: string
    parser!: ReturnType<typeof Parser>
    debug: boolean
    emit: boolean

    constructor(
        inputs: string[],
        output: string,
        namespace: string = common.findPackage()?.name ?? "_compiling_",
        debug = true,
        emit = true,
    ) {
        this.namespace= namespace
        this.inputs = inputs
        this.output = output
        this.debug = debug
        this.emit = emit
    }

    static from(options) {
        if (options instanceof Options) {
            return options
        }
        return new Options(
            options.inputs || [],
            options.output || "",
            options.namespace,
            options.debug || false,
            options.emit || (options.output != null && options.output.length > 0),
        )
    }

}

type OptionsJSON = {
    inputs?: string[]
    output?: string
    namespace?: string
    parser?: ReturnType<typeof Parser>
    debug?: boolean
    emit?: boolean
}

type CompileSingleResult = {
    output?: string
    error?: Error
    map?: any
}

export function compileSingle(source: string, debug = true, name = "sample", ext: ".mjs" | ".js" = ".js"): CompileSingleResult {
    let output = compileSample(source, name, debug, ext)
    if (typeof output === 'string') {
        return { output }
    }
    else {
        return { error: output as Error }
    }
}

export function compileSample(text: string, name = "sample", debug = true, ext: ".mjs" | ".js" = moduleExtension): string | Error {
    let emit = false
    let compiler = new Compiler(() => {})
    let options = new Options([], "null", "none", debug, emit)
    let results = compiler.compile(options, { [name]: text })
    if (results.errors.length > 0) {
        return results.errors[0]
    }
    let output = results.phases.get(toModuleFiles).modules.get(name + ext)
    return output
}

export type Results = {
    phases: Map<Function, any>
    errors: Error[]
}

export default class Compiler {

    logger: Logger

    constructor(logger: Logger = () => {}) {
        this.logger = logger
    }

    watch(optionsOrJson: Options | OptionsJSON) {
        let options = Options.from(optionsOrJson)
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

    compile(
        optionsOrJson: Options | OptionsJSON,
        files?: { [path: string]: string },
        phases: any = undefined,
        logger = this.logger
    ): Results {
        let options = Options.from(optionsOrJson)
        if (phases == null) {
            phases = options.emit ? defaultPhases : noEmit
        }
        options.parser = Parser()
        if (files == null) {
            files = common.getInputFilesRecursive(options.inputs, options.namespace)
        }
        let errors = new Array<any>();
        let phaseResults = new Map<any,any>()
        let root: any = files
        logger("Input", root)
        let lastPhase
        try {
            for (let phase of phases) {
                lastPhase = phase
                root = phase(root, options) || root
                phaseResults.set(phase, root)
                logger(phase.name, root)
            }
            logger("Output", root)
            logger()
        }
        catch (e) {
            errors.push(e)
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
        return { phases: phaseResults, errors }
    }

}