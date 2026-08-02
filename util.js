function parsear(txt) {
    const p = txt.trim().toLowerCase().split(/\s+/);
    if (!p.length) return null;
    const raw = p[0];
    const nota =
        raw.length > 1 && raw[1] === "#"
            ? raw.slice(0, 2).toUpperCase()
            : raw[0].toUpperCase();
    if (!NOTAS.includes(nota)) return null;
    let tipo = raw.slice(nota.length);
    if (p.length > 1) tipo = p.slice(1).join("_");
    tipo = SIN[tipo] ?? tipo;
    if (!ESCALAS[tipo]) return null;
    return [nota, tipo];
}

function calcEscala(nota, tipo) {
    const i = NOTAS.indexOf(nota);
    return ESCALAS[tipo].map((p) => NOTAS[(i + p) % 12]);
}

/**
 * Campo harmônico automático.
 * Empilha terças diatonicamente (grau, grau+2, grau+4 dentro da própria escala)
 * e deduz a qualidade da tríade (M, m, dim, aum) a partir dos intervalos reais
 * entre as notas — funciona para qualquer escala de 7 notas, não só as
 * pré-cadastradas. Escalas com número de graus diferente de 7 (pentatônicas,
 * blues, tons inteiros, cromática, diminuta, aumentada) não formam um campo
 * harmônico tradicional por terças, então retornam null.
 */
function calcCampoHarmonico(nota, tipo) {
    const intervalos = ESCALAS[tipo];
    const n = intervalos.length;
    if (n !== 7) return null;

    const notas = calcEscala(nota, tipo);
    const offset = (grau) => intervalos[grau % n] + 12 * Math.floor(grau / n);

    const campo = [];
    for (let grau = 0; grau < n; grau++) {
        const raiz = offset(grau);
        const terca = (((offset(grau + 2) - raiz) % 12) + 12) % 12;
        const quinta = (((offset(grau + 4) - raiz) % 12) + 12) % 12;

        let qualidade, sufixo, simboloExtra;
        if (terca === 4 && quinta === 7) {
            qualidade = "M";
            sufixo = "";
        } else if (terca === 3 && quinta === 7) {
            qualidade = "m";
            sufixo = "m";
        } else if (terca === 3 && quinta === 6) {
            qualidade = "dim";
            sufixo = "°";
        } else if (terca === 4 && quinta === 8) {
            qualidade = "aum";
            sufixo = "+";
        } else {
            qualidade = "?";
            sufixo = " (?)";
        }

        let romano = ROMANOS[grau];
        if (qualidade === "m" || qualidade === "dim") romano = romano.toLowerCase();
        if (qualidade === "dim") romano += "°";
        if (qualidade === "aum") romano += "+";

        campo.push({
            grau: grau + 1,
            romano,
            raiz: notas[grau],
            qualidade,
            simbolo: notas[grau] + sufixo,
        });
    }
    return campo;
}

function estadoPadrao(inicio) {
    const muteInicial = true; // por padrão nenhuma corda soa até o usuário tocar
    const novo = {};
    for (let c = 1; c <= 6; c++) novo[c] = { muted: muteInicial, fret: 0 };
    return novo;
}

/** Reconhece o acorde formado pelo estado atual do braço. */
function reconhecerAcorde() {
    const soantes = [];
    for (const cordaStr in estado) {
        const st = estado[cordaStr];
        if (st.muted) continue;
        const midi = OPEN_MIDI[cordaStr] + st.fret;
        soantes.push({ corda: +cordaStr, midi, pc: ((midi % 12) + 12) % 12 });
    }
    if (!soantes.length) return { label: null, notas: [], rootPc: null };

    const pcs = [...new Set(soantes.map((s) => s.pc))];
    const notas = pcs.map((p) => NOTAS[p]);
    if (pcs.length === 1) return { label: notas[0], notas, rootPc: pcs[0] };

    const bassMidi = Math.min(...soantes.map((s) => s.midi));
    const bassPc = soantes.find((s) => s.midi === bassMidi).pc;

    let melhor = null;
    for (const root of pcs) {
        const intervalos = [
            ...new Set(pcs.map((p) => (((p - root) % 12) + 12) % 12)),
        ].sort((a, b) => a - b);
        for (const [nome, formula] of FORMULAS) {
            const f = [...formula].sort((a, b) => a - b);
            const igual =
                intervalos.length === f.length &&
                intervalos.every((v, i) => v === f[i]);
            if (igual) {
                const score = (root === bassPc ? 2 : 1) * 100 - formula.length;
                if (!melhor || score > melhor.score) melhor = { score, root, nome };
            }
        }
    }

    if (melhor) {
        const raizNome = NOTAS[melhor.root] + melhor.nome;
        const label =
            melhor.root === bassPc ? raizNome : raizNome + "/" + NOTAS[bassPc];
        return { label, notas, rootPc: melhor.root };
    }
    return { label: null, notas, rootPc: null };
}

function corDoGrau(root, pc) {
    const intervalo = (((pc - root) % 12) + 12) % 12;
    if (intervalo === 0) return "#C9933A";
    if (intervalo === 3 || intervalo === 4) return "#4CAF76";
    if (intervalo === 6 || intervalo === 7 || intervalo === 8) return "#F0F0F0";
    return "#D94F3D";
}

function coordParaCasa(x, y, C, MX, MY, dx, dy, F) {
    const xi = Math.round((x - MX) / dx);
    if (xi < 0 || xi > C - 1) return null;
    const corda = C - xi;
    if (y < MY - 8) return { corda, header: true };
    let i = Math.round((y - MY) / dy);
    i = Math.max(0, Math.min(F, i));
    return { corda, header: false, fret: fretStart + i };
}