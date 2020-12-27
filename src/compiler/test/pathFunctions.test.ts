import { strict as assert } from "assert"

import * as path from "../pathFunctions"

assert.strictEqual(path.getRelative("alpha/foo", "foo/beta"), "foo/beta")
assert.strictEqual(path.getRelative("alpha/foo", "./beta"), "alpha/beta")
assert.strictEqual(path.getRelative("alpha/foo", "../beta"), "beta")
assert.strictEqual(path.getRelative("alpha/foo", "../../beta"), "../beta")

// let alpha = path.join("alpha")
// let beta = path.join("beta")
// let root = path.join()
// assert(path.isAbsolute(path.toAbsolute("foo/bar")))
// assert(!path.isAbsolute("foo/bar"))
// assert.strictEqual(root.length, 0)
// assert.strictEqual(path.getParent(alpha), root, "parent should be same as root")
// assert.strictEqual(path.getRelative(alpha, beta), beta)
// let myPath = path.getPath(path.join("foo", "bar"), "baz")
// assert.strictEqual(myPath, "foo/bar#baz")
// assert.deepStrictEqual(path.getModuleAndExport(myPath), ["foo/bar", "baz"])
