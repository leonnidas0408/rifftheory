// main.js
// Ponto de entrada da aplicação: carrega os dados estáticos (escalas, formas de
// acorde etc.) embutidos no HTML, inicializa o estado global do braço interativo
// e liga os eventos de UI (clique no canvas, tecla Enter no campo de busca).
// As funções chamadas aqui (gerar, atualizarBraco, trata...) estão em draw.js,
// e as funções de cálculo (parsear, calcEscala...) estão em util.js.

// getResource em resources.js — lê e faz JSON.parse dos blocos <script type="application/json">
// definidos no final do index.html, mantendo os dados fora do código JS.
const NOTAS = getResource("NOTAS");       // ["C","C#","D",...] — as 12 notas cromáticas
const ESCALAS = getResource("ESCALAS");   // nome da escala -> intervalos em semitons
const ESTILOS = getResource("ESTILOS");   // nome da escala -> estilos musicais associados
const ROMANOS = getResource("ROMANOS");   // ["I","II",...] — numerais usados no campo harmônico
const FORMAS = getResource("FORMAS");     // nome do acorde -> diagrama de posições no braço

// Apelidos/sinônimos aceitos na busca (ex: "Am" -> tipo "menor"), usados em parsear() (util.js).
// Chave "" (string vazia) cobre o caso de digitar só a nota (ex: "C") = maior por padrão.
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
    6: 40, // Mi (E2) - corda mais grave
    5: 45, // Lá (A2)
    4: 50, // Ré (D3)
    3: 55, // Sol (G3)
    2: 59, // Si (B3)
    1: 64  // Mi (E4) - corda mais aguda
}; // E2 A2 D3 G3 B3 E4

// Fórmulas de acorde (intervalos em semitons a partir da fundamental),
// usadas por reconhecerAcorde() (util.js) para identificar o que está soando no braço.
const FORMULAS = getResource("FORMULAS");

// Estado real do braço: cada corda (1=mi agudo ... 6=mi grave) está muda (muted)
// OU soando numa casa (fret; 0 = corda solta). É a "fonte da verdade" usada tanto
// para desenhar o braço quanto para reconhecer o acorde formado.
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
// C = número de cordas, F = número de casas visíveis por vez na janela do braço,
// MX/MY = margens (em px do canvas) onde a grade de trastes/cordas começa a ser desenhada.
const C = 6,
    F = 5,
    MX = 36,
    MY = 34;

// Qualquer clique no canvas é traduzido em corda/casa por trata() (draw.js),
// que por sua vez usa coordParaCasa() (util.js) para o cálculo geométrico.
canvas.addEventListener("click", (e) => trata(e.clientX, e.clientY)); // trata em draw.js
//

// Permite gerar o resultado apertando Enter no campo de busca, sem precisar clicar no botão.
document.getElementById("campo").addEventListener("keydown", (e) => {
    if (e.key === "Enter") gerar(); // gerar em draw.js
});

// desenha o braço vazio (todas mudas) já na carga da página
atualizarBraco(); // atualizarBraco em draw.js

// Registra o service worker (sw.js) para permitir uso offline (PWA).
// Falha silenciosamente (ex: rodando em file:// ou navegador sem suporte).
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { });
}
