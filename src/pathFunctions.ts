// absolute path related functions
import np from "path"

const ROOT_CHARACTER = ":"
const PATH_SEPARATOR = "/"
const EXPORT_SEPARATOR = "#"
const DEFAULT_EXPORT = "default"

//  path format is
//  path/to/module#export
//  url/to/module.js
//  path/to/module#default => default export
//  path/to/module => same as * export

export function isRelative(path: string) {
    return path.startsWith(".")
}

export function isAbsolute(path: string) {
    return path[0] === ROOT_CHARACTER
}

export function join(...steps: Array<string>) {
    if (steps.length === 0) {
        return ""
    }
    return np.join(...steps).replace(/[\/\\]/g, PATH_SEPARATOR).replace(PATH_SEPARATOR + EXPORT_SEPARATOR, EXPORT_SEPARATOR)
}

export function toAbsolute(path) {
    return isAbsolute(path) ? path : ROOT_CHARACTER + path
}

export const root = join()

export function getModule(path: string) {
    return getModuleAndExport(path)[0]
}

export function getExport(path: string) {
    return getModuleAndExport(path)[1]
}

export function getPath(moduleName: string, exportName = DEFAULT_EXPORT) {
    return moduleName + EXPORT_SEPARATOR + exportName
}

export function getModuleAndExport(path: string) {
    let index = path.lastIndexOf(EXPORT_SEPARATOR)
    if (index < 0) {
        return [path, DEFAULT_EXPORT]
    }
    return [path.slice(0, index), path.slice(index + 1)]
}

export function getParent(path: string) {
    let steps = split(path)
    if (steps.length <= 1) {
        return root
    }
    return join(...steps.slice(0, -1))
}

export function split(path: string) {
    return getModule(path).split(PATH_SEPARATOR)
}

export function getLastName(path: string) {
    let steps = split(path)
    return steps[steps.length - 1]
}

export function getRelative(from: string, to: string) {
    return join(getParent(from), to)
}

// export function sanitize(name: string) {
//     return name.replace(ROOT_REGEX, '.') //.replace(PATH_REGEX, '.')
// }

// export function isParent(parent: string, child: string) {
//     if (child === parent || !child.startsWith(parent)) {
//         return false
//     }
//     let remainder = parent.length > 0 ? child.slice(parent.length + 1) : child
//     return remainder.indexOf(PATH_SEPARATOR) < 0
// }

// export function getUniqueClientName(name: string) {
//     return "::" + name.slice(1)
// }

// export function absolute(...steps: Array<string | null | undefined>) {
//     let path = join(...steps)
//     if (!isAbsolute(path)) {
//         path = ROOT_CHARACTER + path
//     }
//     if (path[1] === PATH_SEPARATOR) {
//         //  this happens if we concatenate with root for some reason.
//         path = ROOT_CHARACTER + path.slice(2)
//     }
//     // a Type export with same name as module also shares the same path (the Type export IS the module)
//     let parent = getParent(path)
//     if (parent && getLastName(parent) === getLastName(path)) {
//         return parent
//     }
//     return path
// }
