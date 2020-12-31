import { traverse } from "@glas/traverse";
import { ArrayPattern, AwaitExpression, BinaryExpression, BreakStatement, CallExpression, ClassDeclaration, ContinueStatement, Declarator, ElementExpression, ForOfStatement, ForStatement, FunctionExpression, Identifier, IfStatement, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, Literal, MemberExpression, ModuleSpecifier, Parameter, Pattern, Property, Reference, RegularExpression, ReturnStatement, ThisExpression, ThrowStatement, TryStatement, Typed, TypeExpression, UnaryExpression, VariableDeclaration, YieldExpression } from "./ast";
import Parser from "./parser";
import reservedWords from "./reservedWords";
import toCodeString from "./toCodeString";
const parser = Parser();

function add(position, offset) {
	return { line: position.line, column: position.column + offset }
}

const keywordTokenTypes = {
	let: ["macro"],
	var: ["macro"],
    type: ["struct"],
    struct: ["macro"],
    class: ["macro"],
    data: ["keyword"],
}

const declarationTokenTypes = ["variable", "readonly"]
const typeTokenTypes = ["type"]

function isType(name: string) {
    return name[0] === name[0].toUpperCase()
}

type SemanticHighlight = {
    line: number
    column: number
    length: number
    tokenType: string
    modifiers: string[]
}
export function getSemanticHighlights(
    text: string,
    fileName: string,
) {
    let results = new Array<SemanticHighlight>();

    function push(locationOrNode, ...tokenTypeAndModifiers) {
        let [tokenType, ...modifiers] = tokenTypeAndModifiers
        let { start, end } = locationOrNode.location ?? locationOrNode;

        let length = (start.line === end.line ? end.column : lines[start.line].length + 1) - start.column;
        //	TODO: add absolute positions to location information to simplify length calculation.
        // console.log(tokenType + ":" + modifiers.join(","))
        results.push({
            line: start.line - 1,
            column: start.column - 1,
            length,
            tokenType,
            modifiers
        })
    }

    function highlightStartingKeywords(line: number, max = 3) {
        let lineText = lines[line];
        let words = lineText.trim().split(/\s+/).slice(0, max);
        for (let word of words) {
            let tokenType = keywordTokenTypes[word];
            if (tokenType == null) {
                if (reservedWords.has(word)) {
                    tokenType = ["keyword"]
                }
            }
            if (Array.isArray(tokenType)) {
                let column = lineText.indexOf(word) + 1;
                push({ start: { line, column }, end: { line, column: column + word.length } }, tokenType[0], ...tokenType.slice(1));
            }
        }
    }

    let lines = ["", ...text.split(/\r\n|\n/)]; // we add "" to 0 so lines are indexed starting at 1

    let ast = parser.parse(text, fileName);
    traverse(ast, {
        enter(node, ancestors) {
            // console.log("????????" + node.constructor.name, node)
            if (node.location == null) {
                return;
            }

            //  DO NOT highlight all declarators, their containers should highlight them.
            //  this also causes a problem because there is a 'Declarator' at the start of each module for it's module.id
            if (Declarator.is(node)) {
                let parent = ancestors[ancestors.length - 1]
                let gparent = ancestors[ancestors.length - 2]
                if (Parameter.is(parent) || Pattern.is(ancestors[ancestors.length - 2])) {
                    push(node, ...(isType(node.name) ? typeTokenTypes : declarationTokenTypes))
                }
            }

            if (ThisExpression.is(node)) {
                push(node, "keyword")
            }

            if (BinaryExpression.is(node)) {
                if (reservedWords.has(node.operator)) {
                    push({ start: node.left.location!.end, end: node.right.location!.start }, "keyword")
                }
            }

            if (ModuleSpecifier.is(node)) {
                highlightStartingKeywords(node.location.start.line, 2);
                push(node.local, ...(isType(node.local.name) ? typeTokenTypes : declarationTokenTypes))
            }

            if (MemberExpression.is(node)) {
                if (Identifier.is(node.property)) {
                    push(node.property, ...declarationTokenTypes)
                }
            }

            if (Property.is(node)) {
                if (Identifier.is(node.key)) {
                    push(node.key, ...declarationTokenTypes)
                }
            }

            if (ImportDeclaration.is(node)) {
                highlightStartingKeywords(node.location.start.line, node.export ? 2 : 1);
                if (node.path) {
                    const last = node.path[node.path.length - 1]
                    let isAutoImport = Identifier.is(last) && node.specifiers.find(s => {
                        if ((ImportNamespaceSpecifier.is(s) || ImportDefaultSpecifier.is(s)) && s.local.name === last.name) {
                            return true
                        }
                    })
                    node.specifiers.length === 1 && node.specifiers[0].location?.start.line === node.location?.start.line
                    for (let step of node.path) {
                        if (Identifier.is(step)) {
                            let isLast = node.path[node.path.length - 1] === step;
                            push(step, ...(isLast && isAutoImport ? ( isType((step as any).name) ? typeTokenTypes : declarationTokenTypes) : ["variable"]))
                        }
                    }
                }
                else {
                    // no path, highlight string
                    push(node.source, "string")
                }
            }

            if (TypeExpression.is(node)) {
                push(node.value, ...typeTokenTypes);
            }

            if (IfStatement.is(node)) {
                // colorize the if
                push({ start: node.location.start, end: add(node.location.start, "if".length) }, "keyword");
                if (node.alternate) {
                    highlightStartingKeywords(node.alternate.location!.start.line, 1);
                }
            }
            if (ForOfStatement.is(node) || ForStatement.is(node)) {
                push({ start: node.location.start, end: add(node.location.start, "for".length) }, "keyword");
                if (ForOfStatement.is(node)) {
                    // highlight the "in"
                    push({ start: add((node.count || node.left).id.location!.end, 0), end: add(node.right.location!.start, 0) }, "keyword");
                }
            }

            if (BreakStatement.is(node) || ContinueStatement.is(node)) {
                push(node, "keyword");
            }

            if (ReturnStatement.is(node) || YieldExpression.is(node) || AwaitExpression.is(node)) {
                highlightStartingKeywords(node.location.start.line, 1);
            }

            if (UnaryExpression.is(node) && node.operator === "delete") {
                highlightStartingKeywords(node.location.start.line, 1);
            }

            if (FunctionExpression.is(node)) {
                if (node.async) {
                    // ideally this would be a token or location.
                    push({ start: node.location.start, end: add(node.location.start, "async".length) }, "keyword");
                }
                if (node.id) {
                    push(node.id, "function");
                }
            }
            if (CallExpression.is(node)) {
                let callee = node.callee as any;
                if (node.new) {
                    push({ start: node.location.start, end: add(node.location.start, "new".length)}, "keyword")
                }
                if (MemberExpression.is(callee)) {
                    callee = callee.property;
                }
                if (Identifier.is(callee)) {
                    push(callee, "function");
                }
            }

            // if (Typed.is(node)) {
            //     if (node.type) {
            //         push(node.type, "type");
            //     }
            // }

            if (VariableDeclaration.is(node)) {
                // let right = (node.export === 2 ? node.value : node.id)!.location;
                // this will keyword color the let/const and export [default]
                highlightStartingKeywords(node.location.start.line)

                if (Identifier.is(node.id)) {
                    if (FunctionExpression.is(node.value)) {
                        if (!reservedWords.has(node.id.name)) {
                            push(node.id, "function");
                        }
                    }
                    else {
                        push(node.id, ...declarationTokenTypes);
                    }
                }
            }

            if (ThrowStatement.is(node)) {
                highlightStartingKeywords(node.location.start.line, 1)
            }

            if (TryStatement.is(node)) {
                highlightStartingKeywords(node.location.start.line, 1)
                if (node.handler) {
                    highlightStartingKeywords(node.handler.location!.start.line, 1)
                }
                if (node.finalizer) {
                    highlightStartingKeywords(node.finalizer.location!.start.line, 1)
                }
            }

            if (ClassDeclaration.is(node)) {
                highlightStartingKeywords(node.location.start.line, 4)
                push(node.id, "struct")
            }

            if (ElementExpression.is(node)) {
                push(node.kind, "struct");
                if (node.close) {
                    push(node.close, "struct");
                }
            }

            if (Literal.is(node) && !ImportDeclaration.is(ancestors[ancestors.length - 1])) {

                if (typeof node.value === "string") {
                    push(node, "string");
                    // could be an outline string.
                    let parent = ancestors[ancestors.length - 1]
                    if (node.location.start.line < node.location.end.line) {
                        for (let line = node.location.start.line + 1; line < node.location.end.line; line++) {
                            let lineText = lines[line]
                            let lineTrimmed = lineText.trimStart()
                            let indent = lineText.length - lineTrimmed.length
                            if (indent <= 1 || VariableDeclaration.is(parent) && indent <= parent.location!.start.column) {
                                // outdent occurred as comments but our greedy parser consumed the comments.
                                break;
                            }
                            push({ start: { line, column: 1 }, end: { line, column: 100 } }, "string");
                        }
                    }
                }
                else if (typeof node.value === "number") {
                    push(node, "number");
                }
                else if (typeof node.value === "boolean") {
                    push(node, "number");
                }
                else if (node.value === null){
                    push(node, "variable");
                }
            }
            if (RegularExpression.is(node)) {
                push(node, "regexp");
            }
            if (Reference.is(node)) {
                push(node, ...(isType(node.name) ? typeTokenTypes : ["variable"]))
            }
        }
    });

    // finally, let's highlight comments.
    for (let line = 1; line < lines.length; line++) {
        let lineText = lines[line];
        if (lineText.trim().startsWith("//")) {
            push({ start: { line, column: 1 }, end: { line, column: lineText.length + 1 }}, "comment");
        }
    }

    return results;
}