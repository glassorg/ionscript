# ionscript
Indented Javascript

## Design Goals

1. Modern Javascript features
2. Beautiful syntax
3. Improve maintainability
4. Improve productivity
5. Improve performance
6. Improve correctness

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
    - yes, it turns out we can do analysis without isolating declarations

- For/of and for/in loops?
    - should we support both?
    - for in is sort of worthless... we would never want to use on arrays, and shouldn't use on objects.
    - can we only have a single for/in loop?
    for [key, value] in map
    for item in array
    for char in "string"
    for [property, value] in object
    for i in 0 .. 10

- Automatic runtime type checks?
    - pros:
        - helps catch bugs
    - cons:
        - slower performance
    - only inserted for debug builds, add explit checks if you want them in release

- Extend built in objects with new functions/properties?
    - pros:
        Can fix and patch missing functionality.
    - cons:
        Frowned upon by javascript community, for good reason in the case of libraries.
        Most important property to set "is" for type checking is already used on Object.is for equality comparisons.
    - Only set ion specific symbols like [ion.symbols.is] on built in objects.
    - Provide "is" for convenience on ion classes.

- Make pure functional collections (DataArray, DataSet, DataMap etc)?
    - pros:
        Can use compound structure keys in sets, maps, and array.indexOf
    - cons:
        Messing with Array decreases performance and new parallel runtime classes complicates things
        Object.freeze really kills array performance... even on arrays that are not frozen
        Would need alternative syntax for outline collection declarations to use standard collections
    - No. Keys should just be strings or integers.
    - In debug mode we can freeze child properties in data classes and add pure functional properties there.

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

## New Features

    Declarative Collections         pure functional equals?
        String  "" => String        
        Array   [] => DataArray
            .indexOf requires equality comparison so we HAVE to use our own subclass of Array
        Map     () => DataMap
        Set     || => DataSet
        Object  {} => DataObject
        Element <> => Dynamic, should be treated as immutable
    All declarative collections are immutable

    Declarative Structure Programming
    or Control Flow within Declarative Structures
        let declarations
    Static Properties
    Property Runtime Type Checks

## Roadmap

    Typescript Implementation
        Name resolution
        Type system syntax
        Type system checking run time
        Javascript compatible output
        Structure Classes
        Structure Array runtime storage
    
    Begin Porting to Ionscript

    Importing environment browser.*, node.*
    Type system checking compile time
    Importing typescript definition files for external types
    Generating output typescript definitions

    Typed Meta Data
        Conditional Meta data removal basd on Debug/Release build
        Inline Unit Tests using meta data ideally

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
    X Type checks on class properties
    X Design way for known good types to bypass checks => remove automatic type checks on release
    X Check Types on function call
      is function for normal classes
    X Write data classes.
    X add static baseClasses to data classes.
        add runtime type checking for data classes... is function
    X Type Declarations, port pre-existing system from Ion develop branch
      .is function on Classes
    X Implement Struct Typed Arrays getter/setters
    X Implement conditional declaration types for if/else statements
      Implement conditional declaration types for conditional expressions
      Type check function calls and throw error if we know they are wrong
      Type check other things

### Absolute Path

global:Number
global:Object
module:foo/bar#line:column:name
