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

- We will not add type annotations to the language in order to satisfy the type checker.
    - Adding them makes the language uglier.
    - The Compile time type checker will only throw errors if it can prove a type will always be wrong.
    - All other type checks can be performed at runtime in debug builds.

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

- Can files be compiled individually or must be compiled as a group?
    - In debug mode files must be able to be incrementally compiled individually.
    - In release mode compilation and optimization as a group is allowed.

- Interfaces?
    - Yes. Interfaces become Type's at runtime and can be implemented statically or dynamically.

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

### Ionscript self compiling reboot

    Use Ionscript for AST.
    Compile normal .js javascript files in parallel.
    Investigate compiling .ts typescript files as well?
    Incremental compiler that takes into account adjacent files.
    Consider *smart* imports and whether or not we want isolated independent file compilation.
    Better type analysis system.
        Intermediate Type table to avoid duplication on each node.
        Try to get everything on single pass but break circular dependencies.
        Then follow up on subsequent passes till everything is typed.

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
    X Write data classes.
    X add static baseClasses to data classes.
    X Type Declarations, port pre-existing system from Ion develop branch
    X Implement Struct Typed Arrays getter/setters
    X Implement conditional declaration types for if/else statements
    X Implement conditional declaration types for conditional expressions
    X Type check function calls and throw error if we know they are wrong
    X   Function call parameters
    X   Assignment to typed variables
    X Change extension to .is
    X Change compiler to isc
    X Runtime type checking
    X   type checking for normal classes handled by ionscript.is function using instanceof
    X   is function for data classes
    X reconvert ionscript import to use .is not function
    X Null, Undefined referenced automatically in ionscript
    - smart import of ionscript
      Built in Template type checking
        Array<Type>
        Set<Type>
        Map<Key,Value>
    X Build a language server
    X Move highlighting logic to ionscript module so we can reuse it.
    X new JSX tranform: https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
    X Add implied optional member checks as is Type checks should never throw
    X Need ability to form long .chains across multiple lines
    X Runtime Properties... which can hold meta data and we can use for the next step.
    X   Property defined
    X   Extend from ionscript.Data
    X   Create Map<string,Property> fields on Data Classes.
    X   Also include inherited properties
    X   Write Data class constructor that uses prototype properties.
    X   Remove Current constructor
    X   Test this in ionscript.platform
    X   Convert back to incremental build.
    X Fix auto prefix of static and instance properties for referencing each other.
    X Data class implementation needs to NOT require external linkage at compile time.
    X   But... if it's dynamic using properties then that would decrease runtime performance.
    X   Fix for incremental compile failing because of above.
    X   Fix module scoped 'parse' and static 'parse' function resolution incorrectly to class.parse
    X   Need Concise Export from Import Syntax
    X   Turn AssignmentStatements into AssignmentExpression
    -   Outline || Operator is ambiguous with Set literal declaration
    X Implement Enumerations and similar Flags
      Let instance declarations ought to be assigned and fixed as dependent variables during construction
      Come up with new consistent class/instance variable values
      Compiler needs to copy any unrecognized files to the output
      Javascript files should also be copied and/or parsed and converted
      Need AssignmentExpressions to actually work, they are useful
      Probably need "abstract" modifier on classes and methods
    X Allow throw expressions from lambdas right side

### Related Links

    F# Implicit Yields similar motivation to our outline expressions
    https://github.com/fsharp/fslang-design/blob/master/FSharp-4.7/FS-1069-implicit-yields.md

    Dart Solution to same problem
    https://medium.com/dartlang/making-dart-a-better-language-for-ui-f1ccaf9f546c#f399

### Absolute Path

global:Number
global:Object
module:foo/bar#line:column:name
