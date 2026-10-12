import { buscarNoCatalogo } from "../data/tabCatalog";

/**
 * Pesquisa somente no catálogo local de partituras completas aprovadas.
 * Não faz scraping nem cria acordes ou tablaturas a partir da busca.
 */
export function buscarCifras(query) {
    return buscarNoCatalogo(query).map((score) => ({
        ...score,
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
