const TAB_BASE = {
    tuning: "E A D G B E",
    capo: "Sem capotraste",
};

const CICLOS_DA_FRASE = 4;

function variarCompasso(linha) {
    let posicao = 0;
    return linha.replace(/\d+|x/g, (nota) => {
        if (nota === "x") return nota;
        const valor = Number(nota);
        const ajuste = [1, 0, -1][posicao++ % 3];
        return String(Math.max(0, Math.min(12, valor + ajuste)));
    });
}

function finalizarCompasso(linha) {
    const notas = [...linha.matchAll(/\d+|x/g)];
    if (!notas.length) return linha;
    const primeiraNota = notas[0][0];
    const ultimaNota = notas[notas.length - 1];
    return `${linha.slice(0, ultimaNota.index)}${primeiraNota}${linha.slice(ultimaNota.index + ultimaNota[0].length)}`;
}

const TAB = (e, b = "", g = "", d = "", a = "", lowE = "") => {
    const linhas = [
        ["e", e],
        ["B", b],
        ["G", g],
        ["D", d],
        ["A", a],
        ["E", lowE],
    ];
    const largura = Math.max(...linhas.map(([, linha]) => linha.length));
    return linhas.map(([corda, linha]) => {
        const compasso = linha.padEnd(largura, "-");
        const variacao = variarCompasso(compasso).padEnd(largura, "-");
        const final = finalizarCompasso(compasso).padEnd(largura, "-");
        const ciclos = [compasso, compasso, variacao, final];
        const frase = ciclos.slice(0, CICLOS_DA_FRASE).join("|");
        return `${corda}|${frase}|`;
    }).join("\n");
};

const ORIGINAL_LICENSE = "CC0 1.0 · composição e arranjo originais do Riff Theory";
const TRADITIONAL_LICENSE = "Melodia tradicional em domínio público · arranjo de acordes original do Riff Theory";

export const TAB_CATALOG = [
    { id: "riff-01", title: "Pulso em Mi menor", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Iniciante", tags: ["aquecimento", "palhetada"], chords: ["Em", "C", "G", "D"], ...TAB_BASE, tab: TAB("0-0-3-0-0-3-", "0-1-3-1-0-1-", "0-0-0-0-0-0-", "2-2-0-2-2-0-", "2-3-2-3-2-3-", "0-0-0-0-0-0-") },
    { id: "riff-02", title: "Alternância em Lá menor", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Iniciante", tags: ["troca de acordes", "ritmo"], chords: ["Am", "F", "C", "G"], ...TAB_BASE, tab: TAB("0-0-1-0-0-1-", "1-1-1-1-1-1-", "2-2-2-2-2-2-", "2-3-2-3-2-3-", "0-0-3-0-0-3-", "0-0-0-0-0-0-") },
    { id: "riff-03", title: "Arpejo aberto em Dó", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Iniciante", tags: ["arpejo", "cordas soltas"], chords: ["C", "G", "Am", "Em"], ...TAB_BASE, tab: TAB("0---0---0---0---", "1---1---1---1---", "0-----0-----0---", "2---------2-----", "3---------------", "----------------") },
    { id: "riff-04", title: "Baixo alternado em Sol", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Iniciante", tags: ["baixo alternado", "folk"], chords: ["G", "D", "Em", "C"], ...TAB_BASE, tab: TAB("3---3---2---0---", "0---3---3---1---", "0---2---2---0---", "0---0---4---2---", "2-------2---3---", "3---------------") },
    { id: "riff-05", title: "Pestana progressiva", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["pestana", "força"], chords: ["F", "G", "Am", "C"], ...TAB_BASE, tab: TAB("1-1-1-1-0-0-", "1-1-1-1-1-1-", "2-2-2-2-0-0-", "3-3-3-3-2-2-", "3-3-3-3-3-3-", "1-1-1-1-0-0-") },
    { id: "riff-06", title: "Síncope em Ré", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["síncope", "mão direita"], chords: ["D", "A", "Bm", "G"], ...TAB_BASE, tab: TAB("2-x-2-2-x-2-", "3-x-3-2-x-3-", "2-x-2-2-x-2-", "0-x-2-0-x-0-", "x-0-2-x-2-x-", "x-x-x-x-x-x-") },
    { id: "riff-07", title: "Blues de doze compassos", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["blues", "shuffle"], chords: ["A7", "D7", "E7"], ...TAB_BASE, tab: TAB("5-5-7-5-5-7-", "5-5-6-5-5-6-", "6-6-7-6-6-7-", "5-5-7-5-5-7-", "7-7-5-7-7-5-", "5-5-5-5-5-5-") },
    { id: "riff-08", title: "Motivo pentatônico em Mi", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["pentatônica", "lead"], chords: ["Em", "G", "A"], ...TAB_BASE, tab: TAB("0-3-0-3-0-3-", "0-3-0-3-0-3-", "0-2-0-2-0-2-", "0-2-0-2-0-2-", "0-2-0-2-0-2-", "0-3-0-3-0-3-") },
    { id: "riff-09", title: "Acordes com sétima", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["acordes", "harmonia"], chords: ["Cmaj7", "Am7", "Dm7", "G7"], ...TAB_BASE, tab: TAB("0---0---1---1---", "0---1---1---0---", "0---0---2---0---", "2---2---0---0---", "3---0---x---2---", "x---x---x---3---") },
    { id: "riff-10", title: "Hammer-on em Lá", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["hammer-on", "legato"], chords: ["Am", "C", "G"], ...TAB_BASE, tab: TAB("0h3-0-0h3-0-", "1---1---1---", "2---0---0---", "2---2---0---", "0---3---2---", "----0---3---") },
    { id: "riff-11", title: "Walking bass em Dó", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Avançado", tags: ["walking bass", "baixo"], chords: ["C", "C7", "F", "G7"], ...TAB_BASE, tab: TAB("0---0---1---3---", "1---1---1---0---", "0---3---2---0---", "2---2---3---0---", "3---3---3---2---", "----0---1---3---") },
    { id: "riff-12", title: "Voicings coloridos", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Avançado", tags: ["maj7", "extensões"], chords: ["Cmaj9", "Am9", "Dm9", "G13"], ...TAB_BASE, tab: TAB("3---3---3---3---", "3---1---5---5---", "4---4---5---4---", "2---2---3---3---", "3---0---5---5---", "x---x---x---3---") },
    { id: "riff-13", title: "Padrão de três notas", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Avançado", tags: ["sequência", "escala"], chords: ["Em7", "A7", "Dmaj7"], ...TAB_BASE, tab: TAB("0-2-3-2-0---", "0-1-3-1-0---", "0-2-4-2-0---", "2-4-5-4-2---", "2-----------", "0-----------") },
    { id: "riff-14", title: "Ritmo reggae em Si menor", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["reggae", "contratempo"], chords: ["Bm", "G", "A", "F#"], ...TAB_BASE, tab: TAB("7-x-7-x-7-x-", "7-x-8-x-7-x-", "7-x-7-x-7-x-", "9-x-9-x-9-x-", "9-x-10-x-9-x", "7-x-x-x-7-x-") },
    { id: "riff-15", title: "Tríades no braço", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["tríades", "mapa do braço"], chords: ["C", "F", "G", "C"], ...TAB_BASE, tab: TAB("8-8-10-10-8-8-", "8-10-10-10-8-8", "9-9-9-9-9-9-", "x-x-x-x-x-x-", "x-x-x-x-x-x-", "x-x-x-x-x-x-") },
    { id: "riff-16", title: "Cromatismo de passagem", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Avançado", tags: ["cromatismo", "lead"], chords: ["Am7", "D7", "Gmaj7"], ...TAB_BASE, tab: TAB("5-6-7-8-7-6-", "5-----------", "5-----------", "5-----------", "7-----------", "5-----------") },
    { id: "riff-17", title: "Dedilhado em 6/8", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Intermediário", tags: ["6/8", "dedilhado"], chords: ["Em", "D", "C", "B7"], ...TAB_BASE, tab: TAB("0---0---0---", "0---3---0---", "0-0-0-2-0-0-", "2---0---2---", "2-------2---", "0-------x---") },
    { id: "riff-18", title: "Riff de oitavas", artist: "Riff Theory", kind: "Exercício original", license: ORIGINAL_LICENSE, difficulty: "Avançado", tags: ["oitavas", "sincronização"], chords: ["E5", "G5", "A5"], ...TAB_BASE, tab: TAB("0---3---5---", "x---x---x---", "4---7---9---", "2---5---7---", "x---x---x---", "0---3---5---") },
    { id: "trad-01", title: "Ode à alegria", artist: "L. van Beethoven", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "clássico"], chords: ["C", "G", "C", "G"], ...TAB_BASE, tab: TAB("0-0-1-3-3-1-0-0-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-02", title: "Brilha, brilha estrelinha", artist: "Melodia tradicional", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "primeiros passos"], chords: ["C", "F", "C", "G"], ...TAB_BASE, tab: TAB("0-0-7-7-9-9-7-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-03", title: "Frère Jacques", artist: "Melodia tradicional", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "ritmo"], chords: ["C", "G", "C"], ...TAB_BASE, tab: TAB("0-2-4-0-0-2-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-04", title: "Amazing Grace", artist: "John Newton / tradição", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "folk"], chords: ["G", "C", "G", "D"], ...TAB_BASE, tab: TAB("0---3-0---3---", "3---0-1---0---", "0-----------0-", "0-----------0-", "2-----------2-", "3-----------3-") },
    { id: "trad-05", title: "Greensleeves", artist: "Melodia tradicional inglesa", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Intermediário", tags: ["melodia", "modo menor"], chords: ["Am", "G", "F", "E"], ...TAB_BASE, tab: TAB("0-1-3-5-3-1-0-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-06", title: "When the Saints Go Marching In", artist: "Melodia tradicional", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "blues"], chords: ["C", "F", "G"], ...TAB_BASE, tab: TAB("0-0-2-3-0-2-3-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-07", title: "Oh! Susanna", artist: "Stephen Foster", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "folk"], chords: ["C", "G", "C", "F"], ...TAB_BASE, tab: TAB("0-0-3-5-7-7-5-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-08", title: "Jingle Bells", artist: "James Lord Pierpont", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "festas"], chords: ["C", "F", "G"], ...TAB_BASE, tab: TAB("0-0-0-0-0-0-", "1-1-1-1-0-0-", "0-0-0-0-0-0-", "2-2-2-2-2-2-", "3-3-3-3-3-3-", "----------------") },
    { id: "trad-09", title: "Auld Lang Syne", artist: "Melodia tradicional escocesa", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "3/4"], chords: ["C", "G", "F"], ...TAB_BASE, tab: TAB("0-0-0-3-2-0-", "1-1-1-0-1-1-", "0-0-0-0-2-0-", "2-2-2-0-0-2-", "3-3-3-2-0-3-", "----------------") },
    { id: "trad-10", title: "Mary Had a Little Lamb", artist: "Melodia tradicional", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Iniciante", tags: ["melodia", "primeiros passos"], chords: ["C", "F", "G"], ...TAB_BASE, tab: TAB("3-1-0-1-3-3-3-", "----------------", "----------------", "----------------", "----------------", "----------------") },
    { id: "trad-11", title: "Scarborough Fair", artist: "Melodia tradicional inglesa", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Intermediário", tags: ["dedilhado", "folk"], chords: ["Am", "G", "Am", "Em"], ...TAB_BASE, tab: TAB("0-0-3-5-3-1-0-", "1---1---1---1-", "2---2---2---2-", "2---2---2---2-", "0---0---0---0-", "----------------") },
    { id: "trad-12", title: "The Water Is Wide", artist: "Melodia tradicional", kind: "Melodia tradicional", license: TRADITIONAL_LICENSE, difficulty: "Intermediário", tags: ["balada", "dedilhado"], chords: ["C", "G", "Am", "F"], ...TAB_BASE, tab: TAB("0---3---5---3-", "1---0---1---1-", "0---0---2---2-", "2---0---2---3-", "3---2---0---3-", "----------------") },
];

export function buscarNoCatalogo(query = "") {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return TAB_CATALOG;
    const terms = normalized.split(/\s+/).filter(Boolean);
    return TAB_CATALOG.filter((item) => {
        const haystack = [item.title, item.artist, item.kind, item.difficulty, ...item.tags, ...item.chords].join(" ").toLocaleLowerCase("pt-BR");
        return terms.every((term) => haystack.includes(term));
    });
}
