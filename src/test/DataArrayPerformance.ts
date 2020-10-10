// import DataArray from "./DataArray"

// //  performance findings on nodejs
// //      1. Object.freeze on Arrays is very slow and it slows down NON-FROZEN array operations after the fact!
// //      2. Array subclasses (like DataArray) kills performance: 20x slower.
// //  conclusion:
// //      extend arrays individually on demand to make pure functional
// //      do we really need a pure functional indexOf function on arrays?
// //      for performance... we wouldn't really use it anyways, and if we needed to we can use .find.
// //      maybe 'freeze' in debug mode, but definitely not in release


// let size = 10000
// let count = 500

// function test(description, ArrayType, freeze = false) {
//     let start = Date.now()

//     let total = 0
//     for (let i = 0; i < count; i++) {
//         let array = ArrayType()
//         for (let k = 0; k < size; k++) {
//             array.push(k)
//         }
//         if (freeze) {
//             Object.freeze(array)
//         }
//         total += array.reduce((a, b) => a + b)
//     }

//     let stop = Date.now()
//     let time = (stop - start)
//     console.log(time + " ms, " + description)
// }

// let foo = Symbol("foo")
// let bar = Symbol("bar")
// let baz = Symbol("baz")
// let handler = function(value) {
//     return value * 2
// }

// // test("Array (freeze)", () => new Array(), true)
// test("Array", () => new Array())
// test("Array with string properties", () => Object.assign(new Array(), { foo: 12, bar: 20}))
// test("Array with symbols", () => {
//     let array = new Array()
//     array[foo] = handler
//     array[bar] = handler
//     array[baz] = handler
//     return array
// })
// test("Array with push override", () => {
//     let array = new Array() as any
//     array.push = function(...args) {
//         Array.prototype.push.call(this, ...args)
//     }
//     return array
// })
// test("Array with push override2", () => {
//     let array = new Array() as any
//     array.push = function(arg) {
//         Array.prototype.push.call(this, arg)
//     }
//     return array
// })
// // test("DataArray", () => new DataArray())
