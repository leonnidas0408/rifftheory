import { useMemo, useState } from "react";
import Barra from "../Barra";
import PrettyPanel from "../PrettyPanel";
import { buscarNoCatalogo, TAB_CATALOG } from "../../data/tabCatalog";

function TabCard({ item }) {
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
            <pre className="tab-pre" aria-label={`Tablatura de ${item.title}`}>{item.tab}</pre>
            <footer className="tab-card-footer">
                <span className="tab-license">{item.license}</span>
                <span className="tab-tags">{item.tags.join(" · ")}</span>
            </footer>
        </article>
    );
}

export default function Tablaturas() {
    const [query, setQuery] = useState("");
    const [filtro, setFiltro] = useState("Todos");
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
                <p>Uma biblioteca inicial de estudos originais e melodias tradicionais, com a licença indicada em cada cartão. Nenhum resultado depende de outro site.</p>
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
                    <div className="tab-grid">{resultados.map((item) => <TabCard key={item.id} item={item} />)}</div>
                ) : (
                    <PrettyPanel><span className="subtitulo">Nenhum item local corresponde à busca. Tente outro título, acorde ou técnica.</span></PrettyPanel>
                )}
            </section>
        </div>
    );
}
