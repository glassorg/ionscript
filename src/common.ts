import * as fs from "fs";
import * as np from "path";
import { traverse } from "@glas/traverse";
import { absolute } from "./pathFunctions";

export function getNodesOfType<T>(root, predicate: (node) => node is T) {
    let nodes = new Array<T>()
    traverse(root, {
        enter(node) {
            if (predicate(node)) {
                nodes.push(node)
            }
        }
    })
    return nodes
}

export function memoize<A extends object, B>(fn: (a: A, ...rest) => B, cacheResultAsKey = false, cache: WeakMap<A, B> = new WeakMap()): (a: A) => B {
    return function(this, arg) {
        let result = cache.get(arg)
        if (result === undefined) {
            cache.set(arg, result = fn.apply(this, arguments as any))
            if (cacheResultAsKey) {
                cache.set(result as any as A, result)
            }
        }
        return result
    }
}

const validIdRegex = /^[a-z_][a-z0-9_]*$/i
export function isValidId(name: string) {
    return validIdRegex.test(name)
}

////////////////////////////////////////////////////////////////////////////////
//  Miscelaneous Functions
////////////////////////////////////////////////////////////////////////////////

export function clone(value) {
    if (value == null || typeof value !== "object") {
        return value
    }
    if (value.clone) {
        return value.clone()
    }
    if (value instanceof Set) {
        return new Set(Array.from(value.values()).map(clone))
    }
    if (value instanceof Map) {
        return new Map(Array.from(value.entries()).map(clone))
    }
    if (Array.isArray(value)) {
        return value.map(clone)
    }
    let newValues = {}
    for (let name in value) {
        newValues[name] = clone(value[name])
    }
    let copy = new value.constructor(newValues)
    return copy
}

export function freeze(object: any, deep: boolean = true) {
    if (object != null && typeof object === 'object') {
        Object.freeze(object)
        if (deep) {
            for (let name in object) {
                freeze(object[name])
            }
        }
    }
}

export function SemanticError(message: string, location: any) {
    let error: any = new Error(message)
    error.location = location.location || location
    return error
}

export function toMap<V>(object: { [name: string]: V }): Map<string,V> {
    let result = new Map<string,V>()
    for (let name in object) {
        result.set(name, object[name])
    }
    return result
}

export function mapValues<K,I,O>(object: Map<K,I>, fn: (I, K) => O): Map<K,O> {
    let result = new Map<K,O>()
    for (let key of object.keys()) {
        let value = object.get(key)
        result.set(key, fn(value, key))
    }
    return result
}

////////////////////////////////////////////////////////////////////////////////
//  Set Functions
////////////////////////////////////////////////////////////////////////////////

export function union(a: Set<any>, b: Set<any>) {
    let result = new Set<any>()
    for (let e of a)
        result.add(e)
    for (let e of b)
        result.add(e)
    return result
}

export function intersection(a: Set<any>, b: Set<any>) {
    let result = new Set<any>()
    for (let e of a) {
        if (b.has(e))
            result.add(e)
    }
    return result
}

export function difference(a: Set<any>, b: Set<any>) {
    let result = new Set<any>()
    for (let e of a) {
        if (!b.has(e))
            result.add(e)
    }
    return result
}

////////////////////////////////////////////////////////////////////////////////
//  File operations
////////////////////////////////////////////////////////////////////////////////

const ionExt = '.ion'

export function read(file: any) {
    return fs.readFileSync(file, 'utf8')
}

export function getPathFromFilename(filename: string) {
    let path = filename.substring(0, filename.length - ionExt.length).split(/[\/\\]+/g)
    return absolute(...path)
}

export function getInputFilesRecursive(directory: string | string[], rootDirectory : string | null = null, allFiles: {[path: string]: string} = {}): {[path: string]: string} {
    if (Array.isArray(directory)) {
        for (let dir of directory) {
            getInputFilesRecursive(dir, dir, allFiles)
        }
    }
    else {
        if (rootDirectory == null)
            rootDirectory = directory
        for (let name of fs.readdirSync(directory)) {
            let filename = np.join(directory, name)
            let fileInfo = fs.statSync(filename)
            if (fileInfo.isFile()) {
                if (name.endsWith(ionExt)) {
                    let path = getPathFromFilename(filename.substring(rootDirectory.length + 1))
                    allFiles[path] = read(filename)
                }
            }
            else {
                getInputFilesRecursive(filename, rootDirectory, allFiles)
            }
        }
    }
    return allFiles
}

export function exists(file: string) {
    return fs.existsSync(file)
}

export function makeDirectories(dir: string) {
    if (!exists(dir)) {
        // make parent first
        makeDirectories(np.dirname(dir))
        // make self
        fs.mkdirSync(dir)
    }
}

export function write(file: string, content: string, encoding?: string) {
    makeDirectories(np.dirname(file))
    if (content != null) {
        if (encoding === undefined && typeof content === 'string')
            encoding = 'utf8'
        fs.writeFileSync(file, content, { encoding } as any)
    }
    else if (exists(file)) {
        fs.unlinkSync(file)
    }
}
