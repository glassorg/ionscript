#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
let [,,input, output, namespace] = process.argv;

if (!input || !output) {
    //  if they don't provide a command then we display usage and available commands
    console.log(
`
    Usage: ionc input output [namespace]

`);
    return 1
} else {
    let clean = (path) => path.endsWith("/") ? input.slice(0, -1) : path
    input = clean(input)
    output = clean(output)
    const { default: Compiler, Options } = require("../lib/Compiler");
    let options = new Options([input], output, namespace);
    let compiler = new Compiler();
    compiler.compile(options);
    return 0;
}
