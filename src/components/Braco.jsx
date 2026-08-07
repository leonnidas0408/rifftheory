import React from "react";
import { trata } from "../draw";

export default function Braco() {
    return (
        <canvas
    id="braco"
    width="900"
    height="260"
    onClick={(e) => trata(e.clientX, e.clientY)}
    style={{
        width: "100%",
        maxWidth: "900px",
        height: "auto",
        display: "block",
        margin: "0 auto"
    }}
></canvas>
    )
}