import { buscarNoCatalogo } from "../data/tabCatalog";

/**
 * Busca apenas no catálogo mantido pelo Riff Theory.
 * O app não faz scraping, não abre Google e não reproduz cifras de terceiros.
 */
export function buscarCifras(query) {
    return buscarNoCatalogo(query).slice(0, 12).map((item) => ({
        ...item,
        title: item.title,
        source: item.artist,
        url: "#tablaturas",
    }));
}

export function normalizarAcordeParaBraco(chord) {
    const bruto = (chord ?? "").trim();
    return {
        chord: bruto,
        normalizedChord: bruto,
    };
}
