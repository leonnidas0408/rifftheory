
// getResource em resources.js
const NOTAS = getResource("NOTAS");
const ESCALAS = getResource("ESCALAS");
const ESTILOS = getResource("ESTILOS");
const ROMANOS = getResource("ROMANOS");
const FORMAS = getResource("FORMAS");
const SIN = {
    "m": "menor",
    "min": "menor",
    "maj": "maior",
    "pent": "pentatonica_menor",
    "harm": "menor_harmonica",
    "mel": "menor_melodica",
    "": "maior"
}

// ---------- Braço interativo ----------
// Altura em semitons das cordas soltas (afinação padrão), com oitava real
// (MIDI), pra reconhecer corretamente a nota de baixo em acordes invertidos.
const OPEN_MIDI = {
    6: 40,
    5: 45,
    4: 50,
    3: 55,
    2: 59,
    1: 64
}; // E2 A2 D3 G3 B3 E4

// Fórmulas de acorde (intervalos em semitons a partir da fundamental).
const FORMULAS = getResource("FORMULAS");

// Estado real do braço: uma corda está muda OU soando numa casa (0 = solta).
let estado = {
    1: { muted: true, fret: 0 },
    2: { muted: true, fret: 0 },
    3: { muted: true, fret: 0 },
    4: { muted: true, fret: 0 },
    5: { muted: true, fret: 0 },
    6: { muted: true, fret: 0 },
};
let fretStart = 0; // primeira casa da janela visível (0 = a partir da pestana)

// --- interação: clicar numa corda (abre/abafa) ou numa casa (dedilha) ---
const canvas = document.getElementById("braco");
const C = 6,
    F = 5,
    MX = 36,
    MY = 34;

canvas.addEventListener("click", (e) => trata(e.clientX, e.clientY)); // trata em draw.js
//

// Gerar por acorde
document.getElementById("campo").addEventListener("keydown", (e) => {
    if (e.key === "Enter") gerar(); // gerar em draw.js
});

// desenha o braço vazio (todas mudas) já na carga da página
atualizarBraco(); // atualizarBraco em draw.js

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { });
}
