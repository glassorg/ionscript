import React from "react"
import CodeSample from "./CodeSample"
import "./Application.css"

export default function Application() {

    return <div className="Application">
        <CodeSample description="Constant Definitions">{
`let x = 12
let name = "Kris"
`
        }</CodeSample>
        <CodeSample description="Typed Variable Declarations">{
`var x: Number
var name: String
`
        }</CodeSample>
        <CodeSample description="Inline and Outline Arrays">{
`let inlineArray = [1, 2, 3]
var outlineArray = []
    1
    2
    3
`
        }</CodeSample>
        <CodeSample description="Outline Arrays with control flow structures">{
`var array = []
    1
    2
    3
    if addFour
        4
`
        }</CodeSample>
    </div>

}