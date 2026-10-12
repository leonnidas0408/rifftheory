// Histórico local de itens verificados abertos pelo usuário.
// Registros antigos são filtrados pela lista de partituras atualmente aprovada.
import { TAB_CATALOG } from "../data/tabCatalog";

const CHAVE_ARMAZENAMENTO = "riffTheoryUltimosAcessos";
const MAX_ITENS = 5;
const IDS_PERMITIDOS = new Set(TAB_CATALOG.map((item) => item.id));

function lerArmazenamento() {
    try {
        const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
        return bruto ? JSON.parse(bruto) : [];
    } catch {
        return [];
    }
}

function gravarArmazenamento(lista) {
    try {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(lista));
    } catch {
        // localStorage indisponível (modo privado, quota etc.) — falha silenciosa.
    }
}

/** Registra somente um item que continua presente no catálogo aprovado. */
export function registrarAcessoCifra(item) {
    if (!item?.id || !IDS_PERMITIDOS.has(item.id)) return;

    const listaAtual = lerArmazenamento();
    const semDuplicata = listaAtual.filter(
        (anterior) => !(anterior.title === item.title && anterior.source === item.source)
    );
    const novaLista = [
        { ...item, timestamp: Date.now() },
        ...semDuplicata,
    ].slice(0, MAX_ITENS);

    gravarArmazenamento(novaLista);
}

/** Retorna só entradas do catálogo atual, sem apagar o histórico persistido do usuário. */
export function obterAcessosRecentes() {
    return lerArmazenamento().filter((item) => IDS_PERMITIDOS.has(item?.id));
}
