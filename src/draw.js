import * as util from "./util";
import ESCALAS from "./assets/constants/ESCALAS.json";
import ESTILOS from "./assets/constants/ESTILOS.json";
import FORMAS from "./assets/constants/FORMAS.json";
import FORMULAS from "./assets/constants/FORMULAS.json";
import NOTAS from "./assets/constants/NOTAS.json";
import ROMANOS from "./assets/constants/ROMANOS.json";

const OPEN_MIDI = {
    6: 40, // Mi (E2) - corda mais grave
    5: 45, // Lá (A2)
    4: 50, // Ré (D3)
    3: 55, // Sol (G3)
    2: 59, // Si (B3)
    1: 64  // Mi (E4) - corda mais aguda
}; // E2 A2 D3 G3 B3 E4

window.estado = {
    1: { muted: true, fret: 0 },
    2: { muted: true, fret: 0 },
    3: { muted: true, fret: 0 },
    4: { muted: true, fret: 0 },
    5: { muted: true, fret: 0 },
    6: { muted: true, fret: 0 },
};
const C = 6,
    F = 5,
    MX = 36,
    MY = 34;

window.fretStart = 0; // primeira casa da janela visível (0 = a partir da pestana)
// draw.js
// Camada de interação e desenho: controla a janela de trastes visível, aplica
// presets de acorde ao braço, redesenha o canvas (desenharBraco) e trata os
// cliques do usuário no braço (trata). Depende dos dados/funções de cálculo
// definidos em util.js e main.js (window.estado, window.fretStart, NOTAS, FORMAS...).

/** Desloca a janela de trastes visível (botões "‹ casa" / "casa ›"), limitada
 *  entre a casa 0 (pestana) e a casa 15, e limpa o braço ao mudar de janela. */
export function moverJanela(delta) {
    window.fretStart = Math.max(0, Math.min(15, window.fretStart + delta));
    window.estado = util.estadoPadrao(window.fretStart);
    atualizarBraco();
}

/** Abafa todas as cordas, mantendo a janela de trastes atual (botão "limpar"). */
export function limparBraco() {
    window.estado = util.estadoPadrao(window.fretStart);
    atualizarBraco();
}

/** Carrega uma forma pré-cadastrada (chips de escala / campo harmônico).
 *  `key` é o nome do acorde (ex: "C", "Am") usado como chave em FORMAS.
 *  Se não houver diagrama cadastrado para essa chave, apenas reseta o braço
 *  na casa aberta (window.fretStart = 0). */
export function carregarPreset(key) {
    window.estado = util.estadoPadrao(0);
    if (FORMAS[key]) {
        const { c: casas, i: inicio } = FORMAS[key];
        window.fretStart = inicio || 0; // "i" define a janela (posição/pestana) recomendada para a forma
        casas.forEach(([corda, casa]) => {
            window.estado[corda] = { muted: false, fret: casa };
        });
    } else {
        window.fretStart = 0;
    }
    atualizarBraco();
}

/**
 * Sincroniza a UI textual do braço (nome do acorde reconhecido, notas soando,
 * rótulo da janela de trastes) com o window.estado atual e redesenha o canvas.
 * Deve ser chamada sempre que `window.estado` ou `window.fretStart` mudam.
 */
export function atualizarBraco() {
    const r = util.reconhecerAcorde();
    console.log(r);
    const nomeEl = document.getElementById("braco-nome");
    const notasEl = document.getElementById("braco-notas");
    nomeEl.textContent = r.label ?? (r.notas.length ? "Não identificado" : "—");
    notasEl.textContent = r.notas.length ? r.notas.join(" · ") : "";
    document.getElementById("braco-janela").textContent =
        window.fretStart === 0 ? "Aberta" : `${window.fretStart}ª–${window.fretStart + 5}ª casa`;
    desenharBraco(r);
}

/**
 * Renderiza os "chips" do campo harmônico (graus I a VII) no card correspondente,
 * a partir da escala calculada. Cada chip é clicável quando existe um diagrama
 * de acorde cadastrado em FORMAS para aquele grau, permitindo carregar a forma
 * no braço interativo. Escalas que não formam campo harmônico tradicional
 * (não têm 7 notas) mostram uma mensagem explicativa em vez dos chips.
 */
export function montarCampoHarmonico(nota, tipo) {
    const cont = document.getElementById("r-campo");
    cont.innerHTML = "";
    const campo = util.calcCampoHarmonico(nota, tipo);

    if (!campo) {
        cont.innerHTML =
            '<div class="card-valor italic">Campo harmônico automático disponível para escalas de 7 notas (esta escala tem ' +
            ESCALAS[tipo].length +
            ").</div>";
        return null;
    }

    campo.forEach((g, idx) => {
        const item = document.createElement("div");
        item.className = "grau-item";

        const num = document.createElement("div");
        num.className = "grau-num";
        num.textContent = g.romano;

        // Diagramas em FORMAS só existem para tríades maiores ("C") e menores ("Am"),
        // por isso a chave é montada como raiz+"m" apenas quando a qualidade é menor.
        const temDiagrama = !!FORMAS[g.raiz + (g.qualidade === "m" ? "m" : "")];

        const chip = document.createElement("button");
        chip.className =
            "chip" +
            (idx === 0 ? " ativo" : "") +
            (temDiagrama ? "" : " indisponivel");
        chip.textContent = g.simbolo;

        if (temDiagrama) {
            chip.onclick = () => {
                cont
                    .querySelectorAll(".chip")
                    .forEach((c) => c.classList.remove("ativo"));
                chip.classList.add("ativo");
                carregarPreset(g.raiz + (g.qualidade === "m" ? "m" : ""));
            };
        }

        item.appendChild(num);
        item.appendChild(chip);
        cont.appendChild(item);
    });

    return campo;
}

/**
 * Handler principal, chamado ao clicar em "GERAR" ou pressionar Enter no campo de busca.
 * Fluxo:
 *  1. Faz o parsing do texto digitado (parsear, em util.js); mostra erro se inválido.
 *  2. Calcula e exibe as notas da escala e o estilo musical associado.
 *  3. Monta o campo harmônico (chips de graus I-VII) quando aplicável.
 *  4. Carrega automaticamente no braço interativo o primeiro acorde do campo
 *     harmônico que tenha diagrama cadastrado (ou a primeira nota da escala
 *     com diagrama, para escalas sem campo harmônico tradicional).
 */
export function gerar() {
    const txt = document.getElementById("campo").value;
    const res = util.parsear(txt);
    if (!res) {
        document.getElementById("erro").textContent =
            "⚠ inválido. Ex: C maior | Am | G blues | F# menor_harmonica";
        return;
    }
    document.getElementById("erro").textContent = "";

    const [nota, tipo] = res;
    const notas = util.calcEscala(nota, tipo);

    document.getElementById("r-escala").textContent = notas.join(" · ");
    document.getElementById("r-estilo").textContent =
        ESTILOS[tipo] ?? "Vários estilos";

    const campo = montarCampoHarmonico(nota, tipo);

    document.getElementById("resultado").style.display = "flex";

    // escolhe o primeiro grau com diagrama disponível pra abrir o braço
    let inicial = null;
    if (campo) {
        const primeiroComDiagrama = campo.find(
            (g) => FORMAS[g.raiz + (g.qualidade === "m" ? "m" : "")],
        );
        if (primeiroComDiagrama)
            inicial =
                primeiroComDiagrama.raiz +
                (primeiroComDiagrama.qualidade === "m" ? "m" : "");
    } else {
        // escalas sem campo harmônico (pentatônicas, blues etc.): usa a 1ª nota com diagrama
        inicial = notas.find((n) => FORMAS[n]) ?? null;
    }
    if (inicial) carregarPreset(inicial);
    else limparBraco();
}

/**
 * Desenha o braço da guitarra no <canvas id="braco"> usando a Canvas API 2D.
 * Recebe `reconhecido` (retorno de util.reconhecerAcorde) para colorir cada nota
 * conforme sua função no acorde (fundamental, terça, quinta...) via corDoGrau.
 * Redesenha tudo do zero a cada chamada (sem otimização incremental), o que é
 * suficiente dado o tamanho pequeno do canvas e a baixa frequência de eventos.
 */
export function desenharBraco(reconhecido) {
    const canvas = document.getElementById("braco");
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
        H = canvas.height;

    // C = cordas, F = casas visíveis; MX/MY = margens; UW/UH = área útil de desenho;
    // dx/dy = espaçamento entre cordas/trastes dentro dessa área.
    const C = 6,
        F = 5;
    const MX = 36,
        MY = 34;
    const UW = W - MX - 16,
        UH = H - MY - 26;
    const dx = UW / (C - 1),
        dy = UH / F;

    // fundo em degradê (efeito "madeira" sutil)
    const fundo = ctx.createLinearGradient(0, 0, 0, H);
    fundo.addColorStop(0, "#1c0f20");
    fundo.addColorStop(1, "#150a15");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = fundo;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 10);
    ctx.fill();

    // marcadores de casa (inlays) nos trastes 3,5,7,9,12...
    ctx.fillStyle = "rgba(240,240,240,0.10)";
    for (let i = 0; i < F; i++) {
        const fretAbs = window.fretStart + i + 1;
        const mod = fretAbs % 12;
        const y = MY + (i + 0.5) * dy;
        if ([3, 5, 7, 9].includes(mod)) {
            ctx.beginPath();
            ctx.arc(MX + UW / 2, y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (mod === 0) {
            ctx.beginPath();
            ctx.arc(MX + UW / 2 - 12, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(MX + UW / 2 + 12, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // indicador da casa inicial da janela
    if (window.fretStart > 0) {
        ctx.fillStyle = "#3a67c9";
        ctx.font = "bold 11px Courier New";
        ctx.textAlign = "right";
        ctx.fillText(window.fretStart + "ª", MX - 8, MY + dy * 0.65);
    }

    // trastes (linhas horizontais) — a primeira é a pestana/nut quando window.fretStart=0
    for (let i = 0; i <= F; i++) {
        const y = MY + i * dy;
        const ehNut = i === 0 && window.fretStart === 0;
        ctx.strokeStyle = ehNut ? "#F0F0F0" : "#4a4a4a";
        ctx.lineWidth = ehNut ? 4 : 1.4;
        ctx.beginPath();
        ctx.moveTo(MX, y);
        ctx.lineTo(MX + UW, y);
        ctx.stroke();
    }

    // cordas (mais grossas nas graves)
    for (let i = 0; i < C; i++) {
        const corda = C - i;
        const x = MX + i * dx;
        ctx.strokeStyle = "#8a8a8a";
        ctx.lineWidth = 0.8 + corda * 0.28;
        ctx.beginPath();
        ctx.moveTo(x, MY);
        ctx.lineTo(x, MY + UH);
        ctx.stroke();
    }

    const root = reconhecido ? reconhecido.rootPc : null;

    // pestana automática: quando 3+ cordas soam na mesma casa, desenha a barra
    const porCasa = {};
    for (let corda = 1; corda <= 6; corda++) {
        const st = window.estado[corda];
        if (!st.muted && st.fret > 0) (porCasa[st.fret] ??= []).push(corda);
    }
    Object.entries(porCasa).forEach(([casaStr, cordas]) => {
        if (cordas.length < 3) return;
        const casa = +casaStr;
        const rel = casa - window.fretStart;
        if (rel < 0 || rel > F) return;
        const y = MY + rel * dy;
        const xis = cordas.map((c) => C - c);
        const x1 = MX + Math.min(...xis) * dx,
            x2 = MX + Math.max(...xis) * dx;
        ctx.fillStyle = "rgba(201,147,58,0.35)";
        ctx.beginPath();
        ctx.roundRect(x1 - 11, y - 11, x2 - x1 + 22, 22, 11);
        ctx.fill();
    });

    // Para cada uma das 6 cordas, desenha um dos três window.estados possíveis:
    // abafada (X vermelho acima da pestana), solta/aberta (círculo verde com o nome
    // da nota) ou pressionada numa casa (bolinha colorida conforme a função no acorde).
    for (let corda = 1; corda <= 6; corda++) {
        const st = window.estado[corda];
        const xi = C - corda;
        const x = MX + xi * dx;

        if (st.muted) {
            ctx.strokeStyle = "#D94F3D";
            ctx.lineWidth = 1.8;
            const y = MY - 16,
                s = 6;
            ctx.beginPath();
            ctx.moveTo(x - s, y - s);
            ctx.lineTo(x + s, y + s);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + s, y - s);
            ctx.lineTo(x - s, y + s);
            ctx.stroke();
            continue;
        }

        const pc = (((OPEN_MIDI[corda] + st.fret) % 12) + 12) % 12;
        const nomeNota = NOTAS[pc];

        if (st.fret === 0) {
            ctx.strokeStyle = "#4CAF76";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(x, MY - 16, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "#4CAF76";
            ctx.font = "bold 8px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(nomeNota, x, MY - 16);
            continue;
        }

        const rel = st.fret - window.fretStart;
        if (rel < 0 || rel > F) continue; // fora da janela visível, não desenha (mas ainda soa)
        const y = MY + rel * dy;
        const cor = root !== null ? util.corDoGrau(root, pc) : "#3a71c9";

        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0D0D0D";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nomeNota, x, y);
    }
}

/**
 * Handler de clique no canvas do braço (chamado a partir do listener em main.js).
 * Converte a posição do clique (em coordenadas de tela) para coordenadas do
 * canvas (considerando o escalonamento CSS x pixels reais) e delega a
 * coordParaCasa (util.js) para descobrir qual corda/casa foi tocada.
 * - Clique no "cabeçalho" da corda: alterna entre abafada -> solta -> abafada.
 * - Clique numa casa: alterna entre tocada naquela casa e abafada (toggle);
 *   clique na casa 0 é ignorado aqui (a corda solta só se ativa pelo cabeçalho).
 */
export function trata(clientX, clientY) {
    const canvas = document.getElementById("braco");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
        scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX,
        y = (clientY - rect.top) * scaleY;
    const UW = canvas.width - MX - 16,
        UH = canvas.height - MY - 26;
    const dx = UW / (C - 1),
        dy = UH / F;

    const alvo = util.coordParaCasa(x, y, C, MX, MY, dx, dy, F);
    if (!alvo) return;
    const st = window.estado[alvo.corda];

    if (alvo.header) {
        if (st.muted) {
            st.muted = false;
            st.fret = 0;
        } else if (st.fret === 0) {
            st.muted = true;
        } else {
            st.muted = true;
            st.fret = 0;
        }
    } else {
        if (alvo.fret < 1) return;
        if (!st.muted && st.fret === alvo.fret) {
            st.muted = true;
            st.fret = 0;
        } else {
            st.muted = false;
            st.fret = alvo.fret;
        }
    }
    atualizarBraco();
}
