function moverJanela(delta) {
    fretStart = Math.max(0, Math.min(15, fretStart + delta));
    estado = estadoPadrao(fretStart);
    atualizarBraco();
}

function limparBraco() {
    estado = estadoPadrao(fretStart);
    atualizarBraco();
}

/** Carrega uma forma pré-cadastrada (chips de escala / campo harmônico). */
function carregarPreset(key) {
    estado = estadoPadrao(0);
    if (FORMAS[key]) {
        const { c: casas, i: inicio } = FORMAS[key];
        fretStart = inicio || 0;
        casas.forEach(([corda, casa]) => {
            estado[corda] = { muted: false, fret: casa };
        });
    } else {
        fretStart = 0;
    }
    atualizarBraco();
}

function atualizarBraco() {
    const r = reconhecerAcorde();
    const nomeEl = document.getElementById("braco-nome");
    const notasEl = document.getElementById("braco-notas");
    nomeEl.textContent = r.label ?? (r.notas.length ? "Não identificado" : "—");
    notasEl.textContent = r.notas.length ? r.notas.join(" · ") : "";
    document.getElementById("braco-janela").textContent =
        fretStart === 0 ? "Aberta" : `${fretStart}ª–${fretStart + 5}ª casa`;
    desenharBraco(r);
}

function montarCampoHarmonico(nota, tipo) {
    const cont = document.getElementById("r-campo");
    cont.innerHTML = "";
    const campo = calcCampoHarmonico(nota, tipo);

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

function gerar() {
    const txt = document.getElementById("campo").value;
    const res = parsear(txt);
    if (!res) {
        document.getElementById("erro").textContent =
            "⚠ inválido. Ex: C maior | Am | G blues | F# menor_harmonica";
        return;
    }
    document.getElementById("erro").textContent = "";

    const [nota, tipo] = res;
    const notas = calcEscala(nota, tipo);

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
        inicial = notas.find((n) => FORMAS[n]) ?? null;
    }
    if (inicial) carregarPreset(inicial);
    else limparBraco();
}

function desenharBraco(reconhecido) {
    const canvas = document.getElementById("braco");
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
        H = canvas.height;

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
    fundo.addColorStop(0, "#20180f");
    fundo.addColorStop(1, "#150f0a");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = fundo;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 10);
    ctx.fill();

    // marcadores de casa (inlays) nos trastes 3,5,7,9,12...
    ctx.fillStyle = "rgba(240,240,240,0.10)";
    for (let i = 0; i < F; i++) {
        const fretAbs = fretStart + i + 1;
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
    if (fretStart > 0) {
        ctx.fillStyle = "#C9933A";
        ctx.font = "bold 11px Courier New";
        ctx.textAlign = "right";
        ctx.fillText(fretStart + "ª", MX - 8, MY + dy * 0.65);
    }

    // trastes (linhas horizontais) — a primeira é a pestana/nut quando fretStart=0
    for (let i = 0; i <= F; i++) {
        const y = MY + i * dy;
        const ehNut = i === 0 && fretStart === 0;
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
        const st = estado[corda];
        if (!st.muted && st.fret > 0) (porCasa[st.fret] ??= []).push(corda);
    }
    Object.entries(porCasa).forEach(([casaStr, cordas]) => {
        if (cordas.length < 3) return;
        const casa = +casaStr;
        const rel = casa - fretStart;
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

    for (let corda = 1; corda <= 6; corda++) {
        const st = estado[corda];
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

        const rel = st.fret - fretStart;
        if (rel < 0 || rel > F) continue; // fora da janela visível, não desenha (mas ainda soa)
        const y = MY + rel * dy;
        const cor = root !== null ? corDoGrau(root, pc) : "#C9933A";

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

function trata(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
        scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX,
        y = (clientY - rect.top) * scaleY;
    const UW = canvas.width - MX - 16,
        UH = canvas.height - MY - 26;
    const dx = UW / (C - 1),
        dy = UH / F;

    const alvo = coordParaCasa(x, y, C, MX, MY, dx, dy, F);
    if (!alvo) return;
    const st = estado[alvo.corda];

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
