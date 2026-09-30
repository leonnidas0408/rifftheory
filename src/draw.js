import * as util from "./util";
import FORMAS from "./assets/constants/FORMAS.json";
import NOTAS from "./assets/constants/NOTAS.json";

const OPEN_MIDI = {
    6: 40, // Mi (E2) - corda mais grave
    5: 45, // Lá (A2)
    4: 50, // Ré (D3)
    3: 55, // Sol (G3)
    2: 59, // Si (B3)
    1: 64  // Mi (E4) - corda mais aguda
}; // E2 A2 D3 G3 B3 E4

// Paleta do layout claro: braço de madeira sobre o painel azul-claro, tônica
// em branco e demais notas em azul.
const CORES = {
    trasteNut: "#f4ecd8",
    corda: "rgba(232,238,246,0.9)",
    inlay: "rgba(255,255,255,0.32)",
    labelCasa: "#5d7597",
    tonica: "#ffffff",
    tonicaTexto: "#1f4f8f",
    tonicaGlow: "rgba(255,255,255,0.75)",
    notaAtiva: "#2f6fe0",
    notaAtivaGlow: "rgba(47,111,224,0.55)",
    aberta: "#2f6fe0",
    muted: "#d2453a",
    etiqueta: "#1f4f8f",
    madeiraA: "#8a5a3c",
    madeiraB: "#6a3f27",
};

// Exibe o nome da nota dentro das bolinhas (botão "Mostrar notas").
window.mostrarNotas = false;

window.estado = {
    1: { muted: true, fret: 0 },
    2: { muted: true, fret: 0 },
    3: { muted: true, fret: 0 },
    4: { muted: true, fret: 0 },
    5: { muted: true, fret: 0 },
    6: { muted: true, fret: 0 },
};

// Constantes de grade — usadas tanto no desenho (desenharBraco) quanto na
// interpretação do clique (trata), por isso precisam ser as mesmas.
const C = 6,
    F = 12,
    MX = 20,
    MY = 38;

// Largura reservada à esquerda do braço para o nome das cordas e para os
// marcadores de corda solta/abafada. NECK_X substitui MX como margem esquerda
// real do grid de trastes — assim o espaçamento entre casas (dx) fica igual em
// qualquer janela.
const LABEL_W = 64;
const NECK_X = MX + LABEL_W;

window.fretStart = 0; // primeira casa da janela visível (0 = a partir da pestana)
// draw.js
// Camada de interação e desenho: controla a janela de trastes visível, aplica
// presets de acorde ao braço, redesenha o canvas (desenharBraco) e trata os
// cliques do usuário no braço (trata). Depende dos dados/funções de cálculo
// definidos em util.js e main.js (window.estado, window.fretStart, NOTAS, FORMAS...).

/** Desloca a janela de trastes visível (botões "‹ casa" / "casa ›"), limitada
 *  entre a casa 0 (pestana) e a casa 12 — já que a janela mostra F=12 casas,
 *  fretStart=12 cobre as casas 13-24, a última janela possível. */
export function moverJanela(delta) {
    window.fretStart = Math.max(0, Math.min(12, window.fretStart + delta));
    window.estado = util.estadoPadrao(window.fretStart);
    atualizarBraco();
}

/** Abafa todas as cordas, mantendo a janela de trastes atual (botão "limpar"). */
export function limparBraco() {
    window.estado = util.estadoPadrao(window.fretStart);
    atualizarBraco();
}

/** Carrega uma forma no braço. `key` pode ser o nome do acorde (ex: "C", "Am")
 *  usado como chave em FORMAS, ou uma forma pronta { c, i } (ver utils/acordes.js).
 *  Se não houver forma, apenas reseta o braço na casa aberta (window.fretStart = 0). */
export function carregarPreset(key) {
    window.estado = util.estadoPadrao(window.fretStart);
    const forma = typeof key === "string" ? FORMAS[key] : key;
    if (forma) {
        const { c: casas, i: inicio } = forma;
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
 *
 * OBS: os elementos "braco-nome", "braco-notas" e "braco-janela" são opcionais
 * — nem toda tela que usa o <Braco /> precisa desse texto auxiliar. Por isso
 * cada getElementById é checado antes de setar textContent, evitando
 * "Cannot read properties of null" quando esses elementos não existem ainda
 * (ex: no primeiro useEffect, antes do resto da Home terminar de montar) ou
 * simplesmente não existem na página. Isso NÃO afeta desenharBraco(r), que
 * sempre roda.
 */
export function atualizarBraco() {
    const r = util.reconhecerAcorde();
    console.log(r);

    const nomeEl = document.getElementById("braco-nome");
    if (nomeEl) {
        nomeEl.textContent = r.label ?? (r.notas.length ? "Não identificado" : "—");
    }

    const notasEl = document.getElementById("braco-notas");
    if (notasEl) {
        notasEl.textContent = r.notas.length ? r.notas.join(" · ") : "";
    }

    const janelaEl = document.getElementById("braco-janela");
    if (janelaEl) {
        janelaEl.textContent =
            window.fretStart === 0
                ? "Aberta"
                : `${window.fretStart + 1}ª–${window.fretStart + F}ª casa`;
    }

    desenharBraco(r);
}

/**
 * Fundo do braço: tampo de madeira com veios sutis (determinísticos, para o
 * desenho não "tremer" a cada redesenho).
 */
function desenharMadeira(ctx, UW, UH) {
    const x = NECK_X;
    const y = MY - 10;
    const h = UH + 20;

    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, CORES.madeiraA);
    grad.addColorStop(1, CORES.madeiraB);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, UW, h, 6);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.clip();

    for (let i = 0; i < 26; i++) {
        const yy = y + (((i * 37) % 100) / 100) * h;
        ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.bezierCurveTo(x + UW * 0.3, yy + 3, x + UW * 0.6, yy - 3, x + UW, yy + 1);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Desenha o braço da guitarra no <canvas id="braco"> usando a Canvas API 2D.
 * Recebe `reconhecido` (retorno de util.reconhecerAcorde) para destacar a
 * tônica do acorde. Redesenha tudo do zero a cada chamada, o que é suficiente
 * dado o tamanho pequeno do canvas e a baixa frequência de eventos.
 */
export function desenharBraco(reconhecido) {
    const canvas = document.getElementById("braco");
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
        H = canvas.height;

    // Área útil do braço (NECK_X é a margem esquerda real).
    const UW = W - NECK_X - MX;
    const UH = H - (MY * 2);

    // Espaçamentos
    const dx = UW / F;          // distância entre casas
    const dy = UH / (C - 1);    // distância entre cordas

    ctx.clearRect(0, 0, W, H);

    desenharMadeira(ctx, UW, UH);

    // nome de cada corda (E B G D A E, da mais aguda para a mais grave)
    for (let i = 0; i < C; i++) {
        const y = MY + i * dy;
        const nome = NOTAS[OPEN_MIDI[C - i] % 12];

        ctx.fillStyle = CORES.etiqueta;
        ctx.beginPath();
        ctx.arc(MX + 12, y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nome, MX + 12, y);
    }

    // marcadores de casa (inlays) e numeração de todas as casas
    for (let i = 0; i < F; i++) {
        const fretAbs = window.fretStart + i + 1;
        const mod = fretAbs % 12;
        const x = NECK_X + (i + 0.5) * dx;
        const y = MY + UH / 2;

        ctx.fillStyle = CORES.inlay;
        if ([3, 5, 7, 9].includes(mod)) {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (mod === 0) {
            ctx.beginPath();
            ctx.arc(x - 12, y, 5, 0, Math.PI * 2);
            ctx.arc(x + 12, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = CORES.labelCasa;
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(String(fretAbs), x, MY + UH + 16);
    }

    // indicador da casa inicial da janela
    if (window.fretStart > 0) {
        ctx.fillStyle = CORES.etiqueta;
        ctx.font = "bold 11px Courier New";
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(window.fretStart + "ª", NECK_X - 8, MY - 14);
    }

    // trastes metálicos (braço deitado)
    for (let i = 0; i <= F; i++) {

        const x = NECK_X + i * dx;
        const ehNut = i === 0 && window.fretStart === 0;

        if (ehNut) {

            // Pestana
            ctx.strokeStyle = CORES.trasteNut;
            ctx.lineWidth = 8;

            ctx.beginPath();
            ctx.moveTo(x, MY - 10);
            ctx.lineTo(x, MY + UH + 10);
            ctx.stroke();

        } else {

            // sombra
            ctx.strokeStyle = "rgba(0,0,0,0.35)";
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(x + 1, MY - 10);
            ctx.lineTo(x + 1, MY + UH + 10);
            ctx.stroke();

            // metal
            const grad = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
            grad.addColorStop(0, "#fdfdfd");
            grad.addColorStop(0.25, "#d9d9d9");
            grad.addColorStop(0.5, "#9a9a9a");
            grad.addColorStop(0.75, "#d9d9d9");
            grad.addColorStop(1, "#ffffff");

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x, MY - 10);
            ctx.lineTo(x, MY + UH + 10);
            ctx.stroke();
        }
    }

    // cordas horizontais (topo = 6ª corda, Mi grave; mais grossas nas graves)
    for (let i = 0; i < C; i++) {
        const corda = C - i;
        const y = MY + i * dy;

        ctx.strokeStyle = CORES.corda;
        ctx.lineWidth = 0.9 + corda * 0.22;

        ctx.beginPath();
        ctx.moveTo(NECK_X, y);
        ctx.lineTo(NECK_X + UW, y);
        ctx.stroke();
    }

    const root = reconhecido ? reconhecido.rootPc : null;


    // pestana automática: quando 3+ cordas soam na mesma casa, desenha a barra
    const porCasa = {};

    for (let corda = 1; corda <= 6; corda++) {
        const st = window.estado[corda];

        if (!st.muted && st.fret > 0) {
            (porCasa[st.fret] ??= []).push(corda);
        }
    }

    Object.entries(porCasa).forEach(([casaStr, cordas]) => {

        if (cordas.length < 3) return;

        const casa = Number(casaStr);
        const rel = casa - window.fretStart;

        if (rel < 0 || rel > F) return;

        // FIX: rel=1 corresponde ao 1º espaço visível (índice 0), não ao
        // 2º — por isso -0.5 (equivalente a (rel-1)+0.5) em vez de +0.5.
        const x = NECK_X + (rel - 0.5) * dx;

        const ys = cordas.map((c) => C - c);

        const y1 = MY + Math.min(...ys) * dy;
        const y2 = MY + Math.max(...ys) * dy;

        ctx.fillStyle = "rgba(255,255,255,0.28)";

        ctx.beginPath();
        ctx.roundRect(
            x - 11,
            y1 - 11,
            22,
            y2 - y1 + 22,
            11
        );
        ctx.fill();
    });

    // Para cada uma das 6 cordas, desenha os estados possíveis
    for (let corda = 1; corda <= 6; corda++) {

        const st = window.estado[corda];
        const xi = C - corda;
        const y = MY + xi * dy;

        if (st.muted) {
            ctx.strokeStyle = CORES.muted;
            ctx.lineWidth = 1.8;

            const x = NECK_X - 16;
            const s = 6;

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
        const ehTonica = root !== null && pc === root;

        if (st.fret === 0) {

            ctx.strokeStyle = CORES.aberta;
            ctx.lineWidth = 2.2;

            ctx.beginPath();
            ctx.arc(NECK_X - 25, y, 8, 0, Math.PI * 2);
            ctx.stroke();

            if (window.mostrarNotas) {
                ctx.fillStyle = CORES.aberta;
                ctx.font = "bold 8px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(nomeNota, NECK_X - 25, y);
            }

            continue;
        }

        const rel = st.fret - window.fretStart;

        if (rel < 0 || rel > F) continue;

        // FIX: mesma correção — rel=1 é o 1º espaço visível (índice 0),
        // por isso -0.5 em vez de +0.5. Sem isso, com o fret já corrigido
        // em trata(), a bolinha apareceria uma casa à frente de onde foi
        // clicado.
        const x = NECK_X + (rel - 0.5) * dx;

        // tônica em branco, demais notas em azul
        const cor = ehTonica ? CORES.tonica : CORES.notaAtiva;

        // halo/glow sutil atrás da nota
        ctx.save();
        ctx.shadowColor = ehTonica ? CORES.tonicaGlow : CORES.notaAtivaGlow;
        ctx.shadowBlur = 14;

        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (window.mostrarNotas) {
            ctx.fillStyle = ehTonica ? CORES.tonicaTexto : "#ffffff";
            ctx.font = "bold 9px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(nomeNota, x, y);
        }

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

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;


    const UW = canvas.width - NECK_X - MX;
    const UH = canvas.height - (MY * 2);

    const dx = UW / F;
    const dy = UH / (C - 1);


    // braço deitado:
    // x define a casa
    // y define a corda

    const corda = Math.floor((y - MY + dy / 2) / dy);
    const casa = Math.floor((x - NECK_X) / dx);


    if (corda < 0 || corda >= C) return;


    const numeroCorda = C - corda;
    const st = window.estado[numeroCorda];


    // clique no cabeçalho da corda (lado esquerdo, agora considerando o headstock)
    if (x < NECK_X) {

        if (st.muted) {
            st.muted = false;
            st.fret = 0;

        } else if (st.fret === 0) {

            st.muted = true;

        } else {

            st.muted = true;
            st.fret = 0;
        }

    } 
    
    // clique em uma casa
    else {

        if (casa < 0 || casa >= F) return;

        // FIX: `casa` é o índice do ESPAÇO clicado (0 = espaço entre a
        // pestana/traste anterior e o 1º traste da janela), que corresponde
        // à casa física fretStart + casa + 1 — faltava o +1. Sem ele, a
        // casa 1 virava fret=0 (rejeitada pelo "fret < 1" abaixo, por isso
        // não funcionava) e todas as outras casas ficavam 1 semitom abaixo
        // do correto (por isso G soava como F#).
        const fret = window.fretStart + casa + 1;

        if (fret < 1) return;


        if (!st.muted && st.fret === fret) {

            st.muted = true;
            st.fret = 0;

        } else {

            st.muted = false;
            st.fret = fret;
        }
    }


    atualizarBraco();
}