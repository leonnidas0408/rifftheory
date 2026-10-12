// Busca no catálogo local de partituras verificadas; não consulta serviços externos.
import React, { useState } from "react";
import Barra from "../Barra";
import { buscarCifras } from "../../utils/cifras";
import { registrarEvento } from "../../utils/usageStats";
import ChordResults from "./ChordResults";
import { TAB_CATALOG } from "../../data/tabCatalog";

const SUGESTOES = TAB_CATALOG.map((item) => item.title);

export default function ChordSearch({ setPage }) {
    const [query, setQuery] = useState("");
    const [resultados, setResultados] = useState(null);
    const [erro, setErro] = useState("");

    function buscar(termoEscolhido) {
        const termo = (typeof termoEscolhido === "string" ? termoEscolhido : query).trim();

        if (!termo) {
            setErro("Digite o título, compositor ou número de catálogo da partitura.");
            setResultados(null);
            return;
        }

        setErro("");
        setQuery(termo);
        registrarEvento("search_submitted", { termo });
        setResultados(buscarCifras(termo));
    }

    return (
        <>
            <Barra onBuscar={() => buscar()}>
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => registrarEvento("search_started", {}, { umaVezPorSessao: true })}
                    onKeyDown={(event) => event.key === "Enter" && buscar()}
                    placeholder="Busque a partitura por título, compositor ou BWV..."
                    id="busca-cifra"
                    aria-label="Buscar partitura verificada"
                    autoComplete="off"
                    spellCheck="false"
                />
            </Barra>

            {erro && <div className="erro">{erro}</div>}

            {!resultados && (
                <div className="sugestoes" aria-label="Partituras completas verificadas">
                    <span className="subtitulo">
                        {SUGESTOES.length === 1
                            ? "Partitura completa verificada:"
                            : "Partituras completas verificadas:"}
                    </span>
                    {SUGESTOES.map((titulo) => (
                        <button key={titulo} className="pilula" onClick={() => buscar(titulo)}>
                            {titulo}
                        </button>
                    ))}
                </div>
            )}

            {resultados && <ChordResults resultados={resultados} setPage={setPage} />}
        </>
    );
}
