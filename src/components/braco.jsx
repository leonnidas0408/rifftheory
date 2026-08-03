import React from "react";
import { trata } from "../draw";

export default function Braco() {
    return (
        <canvas id="braco" width="320" height="220" onClick={(e) => trata(e.clientX, e.clientY)}></canvas>
    );
}