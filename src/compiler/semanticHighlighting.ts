import { traverse } from "@glas/traverse";
import { AwaitExpression, BreakStatement, CallExpression, ClassDeclaration, ContinueStatement, Declarator, ElementExpression, ForOfStatement, ForStatement, FunctionExpression, Identifier, IfStatement, Literal, MemberExpression, Reference, RegularExpression, ReturnStatement, Typed, TypeExpression, VariableDeclaration, YieldExpression } from "./ast";
import Parser from "./parser";
const parser = Parser();

function add(position, offset) {
	return { line: position.line, column: position.column + offset }
}

const keywordTokenTypes = {
	let: ["macro"],
	var: ["variable", "readonly"],
	type: ["macro"],
	export: ["keyword"],
	default: ["keyword"],
	class: ["macro"],
	return: ["keyword"],
	yield: ["keyword"],
	else: ["keyword"],
	await: ["keyword"],
	async: ["keyword"],
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

    function push(locationOrNode, tokenType, ...modifiers) {
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
            if (tokenType != null) {
                let column = lineText.indexOf(word) + 1;
                push({ start: { line, column }, end: { line, column: column + word.length } }, tokenType[0], ...tokenType.slice(1));
            }
        }
    }

    let lines = ["", ...text.split(/\r\n|\n/)]; // we add "" to 0 so lines are indexed starting at 1

    let ast = parser.parse(text, fileName);
    traverse(ast, {
        enter(node) {
            if (node.location == null) {
                return;
            }

            if (TypeExpression.is(node)) {
                push(node.value, "type");
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
                    push({ start: add(node.left.id.location!.end, 0), end: add(node.right.location!.start, 0) }, "keyword");
                }
            }

            if (BreakStatement.is(node) || ContinueStatement.is(node)) {
                push(node, "keyword");
            }

            if (ReturnStatement.is(node) || YieldExpression.is(node) || AwaitExpression.is(node)) {
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
                if (MemberExpression.is(callee)) {
                    callee = callee.property;
                }
                if (Identifier.is(callee)) {
                    push(callee, "function");
                }
            }

            if (Typed.is(node)) {
                if (node.type) {
                    push(node.type, "type");
                }
            }

            if (VariableDeclaration.is(node)) {
                let right = (node.export === 2 ? node.value : node.id)!.location;
                // this will keyword color the let/const and export [default]
                highlightStartingKeywords(node.location.start.line)

                if (Identifier.is(node.id)) {
                    push(node.id, "variable", "declaration", node.kind === "let" ? "readonly" : "");
                }
            }

            if (ClassDeclaration.is(node)) {
                highlightStartingKeywords(node.location.start.line)
            }

            if (ElementExpression.is(node)) {
                push(node.kind, "struct");
                if (node.close) {
                    push(node.close, "struct");
                }
            }

            if (Literal.is(node)) {
                if (typeof node.value === "string") {
                    push(node, "string");
                    // could be an outline string.
                    if (node.location.start.line < node.location.end.line) {
                        for (let line = node.location.start.line; line < node.location.end.line; line++) {
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
                    push(node, "null");
                }
            }
            if (RegularExpression.is(node)) {
                push(node, "regexp");
            }
            if (Declarator.is(node)) {
                push(node, "variable", "declaration")
            }
            if (Reference.is(node)) {
                push(node, "variable")
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