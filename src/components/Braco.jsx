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
            tabIndex={0}
            role="img"
            aria-label="Braço interativo. Clique em uma corda ou casa para selecionar e ouvir uma nota."
            onClick={(e) => {
                const nota = trata(e.clientX, e.clientY);
                onInteragir?.(nota);
            }}
        />
    );
}
