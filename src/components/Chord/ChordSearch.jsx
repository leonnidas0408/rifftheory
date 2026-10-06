// src/components/Chord/ChordSearch.jsx
// Componente visual + estado local da busca de cifras. Não faz nenhuma
// requisição de rede — apenas monta os resultados via buscarCifras()
// (src/utils/cifras.js) e delega a exibição para ChordResults.

import React, { useState } from "react";
import Barra from "../Barra";
import { buscarCifras } from "../../utils/cifras";
import { registrarEvento } from "../../utils/usageStats";
import ChordResults from "./ChordResults";

// Músicas para começar sem digitar (só viram um termo de busca).
const SUGESTOES = [
    "Tempo Perdido Legião Urbana",
    "Trem-Bala Ana Vilela",
    "Evidências Chitãozinho e Xororó",
    "Wonderwall Oasis",
];

export default function ChordSearch() {
    const [query, setQuery] = useState("");
    const [resultados, setResultados] = useState(null);
    const [erro, setErro] = useState("");

    function buscar(termoEscolhido) {
        const termo = (typeof termoEscolhido === "string" ? termoEscolhido : query).trim();

        if (!termo) {
            setErro("Digite o nome de uma música ou artista.");
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
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => registrarEvento("search_started", {}, { umaVezPorSessao: true })}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                    placeholder="Pesquise uma música ou artista para encontrar a cifra..."
                    id="busca-cifra"
                    aria-label="Buscar cifra"
                    autoComplete="off"
                    spellCheck="false"
                />
            </Barra>

            {erro && <div className="erro">{erro}</div>}

            {!resultados && (
                <div className="sugestoes" aria-label="Sugestões de músicas">
                    <span className="subtitulo">Sem ideia? Comece por uma destas:</span>
                    {SUGESTOES.map((musica) => (
                        <button key={musica} className="pilula" onClick={() => buscar(musica)}>
                            {musica}
                        </button>
                    ))}
                </div>
            )}

            {resultados && <ChordResults resultados={resultados} />}
        </>
    );
}
