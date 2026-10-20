import { calcCampoHarmonico, calcEscala } from "../../util";

export const CHAVES = ["C", "G", "D", "A", "E"];

export const VOICINGS = [
    { acorde: "C", nome: "C aberto", notas: ["C4", "E4", "G4", "C5", "E5"], uso: "Brilhante e aberto; ótimo para começar." },
    { acorde: "C", nome: "C na região média", notas: ["G3", "C4", "E4", "G4"], uso: "Mais compacto para acompanhar voz." },
    { acorde: "G", nome: "G aberto", notas: ["G3", "B3", "D4", "G4", "B4"], uso: "Base forte para pop, folk e rock." },
    { acorde: "G", nome: "G com terça no topo", notas: ["G3", "D4", "G4", "B4", "D5"], uso: "Som amplo para finalizar frases." },
    { acorde: "Am", nome: "Am aberto", notas: ["A3", "E4", "A4", "C5", "E5"], uso: "Menor e cantável para baladas." },
    { acorde: "Am", nome: "Am compacto", notas: ["A3", "C4", "E4", "A4"], uso: "Menos grave, deixa espaço para o baixo." },
    { acorde: "F", nome: "F simplificado", notas: ["F3", "C4", "F4", "A4", "C5"], uso: "Alternativa confortável à pestana completa." },
    { acorde: "F", nome: "Fmaj7", notas: ["F3", "A3", "C4", "E4", "A4"], uso: "Cor suave para pop, worship e MPB." },
    { acorde: "Dm", nome: "Dm aberto", notas: ["D3", "A3", "D4", "F4", "A4"], uso: "Menor aberto para versos e dedilhados." },
    { acorde: "Em", nome: "Em aberto", notas: ["E3", "B3", "E4", "G4", "B4"], uso: "Grave e ressonante para rock e folk." },
    { acorde: "A", nome: "A aberto", notas: ["A3", "E4", "A4", "C#5", "E5"], uso: "Base maior para blues e progressões pop." },
];

export const PROGRESSOES = [
    { nome: "Pop essencial", graus: "I – V – vi – IV", acordes: ["C", "G", "Am", "F"], contexto: "Versos e refrões cantáveis." },
    { nome: "Rock em Mi", graus: "i – VI – III – VII", acordes: ["Em", "C", "G", "D"], contexto: "Base para riffs e power chords." },
    { nome: "Blues maior", graus: "I7 – IV7 – V7", acordes: ["A7", "D7", "E7"], contexto: "Shuffle e frases pentatônicas." },
    { nome: "Tensão modal", graus: "i – bVII – bVI", acordes: ["Am", "G", "F"], contexto: "Clima menor para explorar modos." },
];

export const ESCALAS_CONTEXTUAIS = [
    { tipo: "maior", nome: "Maior / Jônio", contexto: "Pop, folk e clássico", dica: "Use para melodias claras e progressões I–V–vi–IV." },
    { tipo: "pentatonica_menor", nome: "Pentatônica menor", contexto: "Rock, blues e solos", dica: "Comece pelas notas da tônica e da quinta sobre acordes menores." },
    { tipo: "blues", nome: "Blues", contexto: "Blues, rock e soul", dica: "Adicione a blue note entre a quarta e a quinta para criar tensão." },
    { tipo: "dorico", nome: "Dórico", contexto: "Funk, jazz e rock", dica: "Destaque a sexta maior sobre um acorde menor." },
    { tipo: "mixolidio", nome: "Mixolídio", contexto: "Blues, rock clássico e dominante", dica: "Funciona naturalmente sobre acordes 7 da tonalidade." },
    { tipo: "menor_harmonica", nome: "Menor harmônica", contexto: "Metal neoclássico", dica: "Use a sétima maior para puxar com força para a tônica." },
];

export const ESTILOS = [
    { nome: "Igreja / worship", padrão: "Acordes abertos, sus2, sus4 e dinâmica crescente", timbre: "Clean com compressor, delay pontuado e reverb amplo", equipamento: "Captador do braço, ganho baixo e volume da mão direita controlado" },
    { nome: "Rock", padrão: "Power chords, oitavas e pentatônica menor", timbre: "Médio presente, overdrive e ambiência curta", equipamento: "Captador da ponte, palheta firme e ganho moderado" },
    { nome: "Pop", padrão: "Progressões I–V–vi–IV e dedilhados regulares", timbre: "Clean brilhante com compressão leve", equipamento: "Captador do meio ou braço e ataque uniforme" },
    { nome: "Blues", padrão: "Shuffle, dominante 7 e respostas pentatônicas", timbre: "Overdrive quente com médios e pouca ambiência", equipamento: "Captador do braço, dinâmica entre palhetada e dedos" },
];

export const AVANCADO = [
    { titulo: "Trocas mais fáceis", texto: "Procure dedos e notas que continuam no mesmo lugar quando você muda de acorde. Mova só o necessário." },
    { titulo: "Cores depois do básico", texto: "Quando as tríades estiverem firmes, experimente acordes com 7, 9 ou sus4 e compare a sensação." },
    { titulo: "Um ritmo por vez", texto: "Toque a mesma progressão com batidas regulares, pausas e dedilhado antes de acelerar ou trocar os acordes." },
];

export const TREINO_OUVIDO = [
    { resposta: "C", notas: ["C4", "E4", "G4"] },
    { resposta: "Am", notas: ["A3", "C4", "E4"] },
    { resposta: "G", notas: ["G3", "B3", "D4"] },
];

export function gerarHarmonia(nota = "C") {
    const campo = calcCampoHarmonico(nota, "maior") ?? [];
    return campo.map((grau) => grau.simbolo);
}

export function notasDaEscala(nota, tipo) {
    try {
        return calcEscala(nota, tipo);
    } catch {
        return [];
    }
}

export function sugestoesParaAcorde(acorde) {
    const base = acorde.replace(/7|maj7|m7|sus.*/g, "");
    if (acorde.includes("m")) return ["pentatônica menor", "dórica", "menor natural"];
    if (acorde.includes("7")) return ["mixolídio", "blues", "pentatônica menor da terça"];
    return ["maior", "pentatônica maior", "pentatônica menor relativa"];
}

export function caminhoImproviso(acorde = "C") {
    const menor = acorde.includes("m");
    return menor ? ["tônica", "terça menor", "quarta", "quinta", "sétima menor"] : ["tônica", "terça maior", "quinta", "sexta", "sétima maior"];
}

export function arpejoDoAcorde(acorde = "C") {
    const voicing = VOICINGS.find((item) => item.acorde === acorde.replace(/7|maj7/g, ""));
    return voicing ? [...new Set(voicing.notas.map((nota) => nota.replace(/[0-9]/g, "")))] : ["C", "E", "G"];
}
