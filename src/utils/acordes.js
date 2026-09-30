// acordes.js
// Monta a forma (posição no braço) de qualquer tríade do campo harmônico.
// Formas abertas vêm de FORMAS.json; as demais são derivadas de formas
// móveis (pestana) deslocadas até a casa da tônica.

import FORMAS from "../assets/constants/FORMAS.json";
import NOTAS from "../assets/constants/NOTAS.json";

// Cada modelo lista [corda, deslocamento] a partir da casa da tônica.
// A corda da tônica de cada modelo vem em CORDA_TONICA (classe de altura da corda solta).
const MODELOS = {
    M: {
        E: [[6, 0], [5, 2], [4, 2], [3, 1], [2, 0], [1, 0]],
        A: [[5, 0], [4, 2], [3, 2], [2, 2], [1, 0]],
    },
    m: {
        E: [[6, 0], [5, 2], [4, 2], [3, 0], [2, 0], [1, 0]],
        A: [[5, 0], [4, 2], [3, 2], [2, 1], [1, 0]],
    },
    dim: {
        A: [[5, 0], [4, 1], [3, 2], [2, 1]],
        D: [[4, 0], [3, 1], [2, 3], [1, 1]],
    },
};

const PC_CORDA_SOLTA = { E: 4, A: 9, D: 2 };

/**
 * Retorna { c: [[corda, casa], ...], i } no mesmo formato de FORMAS.json
 * (i = primeira casa da janela do braço), ou null quando não há forma
 * conhecida para a qualidade (ex: acorde aumentado).
 */
export function formaDoAcorde(raiz, qualidade) {
    if (qualidade === "M" || qualidade === "m") {
        const aberta = FORMAS[raiz + (qualidade === "m" ? "m" : "")];
        if (aberta) return { c: aberta.c, i: aberta.i || 0 };
    }

    const modelos = MODELOS[qualidade];
    if (!modelos) return null;

    const pc = NOTAS.indexOf(raiz);
    let melhor = null;

    for (const [nome, modelo] of Object.entries(modelos)) {
        const casa = (pc - PC_CORDA_SOLTA[nome] + 12) % 12;
        if (!melhor || casa < melhor.casa) melhor = { casa, modelo };
    }

    const c = melhor.modelo.map(([corda, desloc]) => [corda, melhor.casa + desloc]);
    const maiorCasa = Math.max(...c.map(([, casa]) => casa));

    return { c, i: maiorCasa > 12 ? melhor.casa - 1 : 0 };
}
