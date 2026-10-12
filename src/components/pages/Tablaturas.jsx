import { useMemo, useState } from "react";
import Barra from "../Barra";
import PrettyPanel from "../PrettyPanel";
import { buscarNoCatalogo, TAB_CATALOG } from "../../data/tabCatalog";

function explicar(item) {
    const foco = item.tags[0] || "coordenação";
    const acordeTexto = item.chords.join(", ");
    if (item.kind === "Exercício original") {
        return `Este estudo original foi criado para trabalhar ${foco}. A sequência usa ${acordeTexto} como base harmônica; toque cada mudança com som limpo e mantenha a mão direita constante antes de acelerar.`;
    }
    return `Este arranjo didático usa uma melodia tradicional sobre ${acordeTexto}. A linha foi simplificada para estudo no violão: primeiro memorize o desenho melódico, depois acrescente os acordes e ajuste o andamento ao seu nível.`;
}

function comoEstudar(item) {
    const foco = item.tags.slice(0, 2).join(" e ") || "a coordenação";
    return [
        `Comece em 60 BPM e toque ${foco} lentamente, sem parar entre os compassos.`,
        `Separe os trechos difíceis em ciclos de quatro batidas e confira se todas as notas soam claras.`,
        `Aumente o metrônomo de 5 em 5 BPM somente quando conseguir repetir o padrão três vezes sem erro.`,
    ];
}

function TabCard({ item, onOpen }) {
    return (
        <article className="tab-card">
            <div className="tab-card-head">
                <div>
                    <span className="tab-kicker">{item.kind}</span>
                    <h3>{item.title}</h3>
                    <p>{item.artist}</p>
                </div>
                <span className="tab-difficulty">{item.difficulty}</span>
            </div>
            <div className="tab-meta">
                <span>Afinação: {item.tuning}</span>
                <span>{item.capo}</span>
                <span>Acordes: {item.chords.join(" · ")}</span>
            </div>
            <pre className="tab-pre" aria-label={`Resumo da tablatura de ${item.title}`}>{item.tab}</pre>
            <p className="tab-card-explanation">{explicar(item)}</p>
            <footer className="tab-card-footer">
                <span className="tab-license">{item.license}</span>
                <span className="tab-tags">{item.tags.join(" · ")}</span>
            </footer>
            <button type="button" className="link-botao tab-open-button" onClick={() => onOpen(item)}>
                Abrir tab e explicação
            </button>
        </article>
    );
}

function TabDetail({ item, onClose }) {
    const passos = comoEstudar(item);
    return (
        <div className="tab-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="tab-modal" role="dialog" aria-modal="true" aria-labelledby="tab-modal-title">
                <button type="button" className="tab-modal-close" onClick={onClose} aria-label="Fechar tablatura">×</button>
                <span className="tab-kicker">{item.kind} · {item.difficulty}</span>
                <h2 id="tab-modal-title">{item.title}</h2>
                <p className="tab-modal-artist">{item.artist}</p>
                <div className="tab-modal-meta">
                    <span>Afinação: {item.tuning}</span>
                    <span>{item.capo}</span>
                    <span>Acordes: {item.chords.join(" · ")}</span>
                </div>
                <div className="tab-detail-section">
                    <h3>Tablatura completa</h3>
                    <pre className="tab-pre tab-pre-detail" aria-label={`Tablatura completa de ${item.title}`}>{item.tab}</pre>
                </div>
                <div className="tab-detail-section">
                    <h3>O que você vai praticar</h3>
                    <p>{explicar(item)}</p>
                </div>
                <div className="tab-detail-section">
                    <h3>Como estudar</h3>
                    <ol className="tab-study-steps">{passos.map((passo) => <li key={passo}>{passo}</li>)}</ol>
                </div>
                <div className="tab-modal-license">{item.license}</div>
            </section>
        </div>
    );
}

export default function Tablaturas() {
    const [query, setQuery] = useState("");
    const [filtro, setFiltro] = useState("Todos");
    const [aberta, setAberta] = useState(null);
    const resultados = useMemo(() => {
        const base = buscarNoCatalogo(query);
        return filtro === "Todos" ? base : base.filter((item) => item.kind === filtro);
    }, [filtro, query]);

    return (
        <div className="pagina">
            <Barra titulo="Tablaturas" />
            <section className="tab-hero" aria-labelledby="tab-title">
                <span className="eyebrow">CATÁLOGO LOCAL · SEM SCRAPING</span>
                <h1 id="tab-title">Cifras e tabs para tocar dentro do Riff Theory.</h1>
                <p>Abra qualquer cartão para ver a tablatura completa, entender o objetivo do estudo e seguir um roteiro de prática. Nenhum resultado depende de outro site.</p>
                <div className="tab-stats" aria-label="Resumo do catálogo">
                    <strong>{TAB_CATALOG.length}<span> estudos disponíveis</span></strong>
                    <strong>20–400<span> BPM para praticar</span></strong>
                    <strong>CC0 + DP<span> fontes permitidas</span></strong>
                </div>
            </section>

            <section className="tab-library" aria-labelledby="tab-library-title">
                <div className="tab-library-heading">
                    <div>
                        <span className="eyebrow">BIBLIOTECA</span>
                        <h2 id="tab-library-title">Encontre uma cifra ou tablatura</h2>
                    </div>
                    <span className="subtitulo">{resultados.length} resultado{resultados.length === 1 ? "" : "s"}</span>
                </div>
                <Barra>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar título, artista, acorde ou técnica..."
                        aria-label="Buscar no catálogo local de tablaturas"
                    />
                </Barra>
                <div className="tab-filters" role="group" aria-label="Filtrar catálogo">
                    {["Todos", "Exercício original", "Melodia tradicional"].map((option) => (
                        <button key={option} type="button" className={`pilula${filtro === option ? " ligada" : ""}`} onClick={() => setFiltro(option)} aria-pressed={filtro === option}>{option}</button>
                    ))}
                </div>
                {resultados.length ? (
                    <div className="tab-grid">{resultados.map((item) => <TabCard key={item.id} item={item} onOpen={setAberta} />)}</div>
                ) : (
                    <PrettyPanel><span className="subtitulo">Nenhum item local corresponde à busca. Tente outro título, acorde ou técnica.</span></PrettyPanel>
                )}
            </section>
            {aberta && <TabDetail item={aberta} onClose={() => setAberta(null)} />}
        </div>
    );
}
