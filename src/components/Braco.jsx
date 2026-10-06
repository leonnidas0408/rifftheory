import React, { useEffect } from "react";
import { trata, atualizarBraco } from "../draw";

export default function Braco({ onInteragir }) {
    useEffect(() => {
        atualizarBraco();
    }, []);

    return (
        <canvas
            id="braco"
            width="1000"
            height="260"
            onClick={(e) => {
                trata(e.clientX, e.clientY);
                onInteragir?.();
            }}
        />
    );
}