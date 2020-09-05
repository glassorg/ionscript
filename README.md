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

    X FunctionExpressions
    If/Else
    While
    For
    ClassDeclaration
    Async/Await
    Generators
    Destructors
    