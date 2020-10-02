# ionscript
Indented Javascript

## Design Goals

1. Modern Javascript features
2. Beautiful syntax
3. Improve maintainability
4. Improve productivity
5. Improve correctness
6. Improve performance

## Design Decisions

- Use a literate programming model?
    - pros:
        - good cohesion between documentation and code
    - cons:
        - comprehension of code is decreased by separation of sections
    - No.

- Use an ion generated strongly typed ast?
    - Yes, it simplifies logic, checks types better and can be replaced with bootstrapped classes later.

- Allow Statements in the root of a module?
    - pros:
        - javascript can do it and we need to shim things
    - cons:
        - makes analyzing everything as declarations trickier.
    - ?.

- For/of and for/in loops?
    - should we support both?
    - for in is sort of worthless... we would never want to use on arrays, and shouldn't use on objects.
    - can we only have a single for/in loop?
    for [key, value] in map
    for item in array
    for char in "string"
    for [property, value] in object
    for i in 0 .. 10

## Syntax

### Import

    // this works, but... it uses brackets... unnecessarily
    import defaultName, * as name, { exportName as localName, ... } from "path"

    import "foo.bar"    // source: Literal
        as blam         // ImportDefaultSpecifier
        * as blam       // ImportNamespaceSpecifier
        baz as foo      // ImportSpecifier
        bar             // ImportSpecifier

    import foo.bar      // same as import "foo.bar" as bar, source: Path

### Class Declarations

    class Foo
        var x: Type = defaultValue
        let y = Expression

        property bar = {}
            get() =>
            set(value) =>
            value: Any
            writable: Boolean
            enumerable: Boolean
            configurable: Boolean

## New Features

    Declarative Structure Programming
    or Control Flow within Declarative Structures
        let declarations
    Static Properties
    Property Runtime Type Checks


## Roadmap

    0.1 Javascript compatible output
    0.2 Name resolution
    0.3 Importing environment browser.*, node.*
    0.4 Type system syntax
    0.5 Type system checking compile time
    0.6 Type system checking run time
    0.7 Importing typescript definition files for external types
    0.8 Generating output typescript definitions
    0.9 Structure Classes
    1.0 Structure Array runtime storage

## Todo

    X ClassDeclaration
    X Module Level Execution (Side Effects, Shimming, etc)
    X Spread Operators
    X Compilation
    X Async/Await
    X Generators
    X Static Methods
    X Static Properties
    X   let properties change to getters.
      Type Declarations, port pre-existing system from Ion develop branch
      .is function on Classes
      Type checks on class properties
      Property definition
      Design way for known good types to bypass checks
        on functions
        on constructors
      Check Types on function call

    What if any 'let' declaration on a class if it was determined that it was static... then it was static.