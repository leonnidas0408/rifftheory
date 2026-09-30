// src/components/Chord/ChordSearch.jsx
// Componente visual + estado local da busca de cifras. Não faz nenhuma
// requisição de rede — apenas monta os resultados via buscarCifras()
// (src/utils/cifras.js) e delega a exibição para ChordResults.

import React, { useState } from "react";
import Barra from "../Barra";
import { buscarCifras } from "../../utils/cifras";
import ChordResults from "./ChordResults";

export default function ChordSearch() {
    const [query, setQuery] = useState("");
    const [resultados, setResultados] = useState(null);
    const [erro, setErro] = useState("");

    function buscar() {
        const termo = query.trim();

        if (!termo) {
            setErro("Digite o nome de uma música ou artista.");
            setResultados(null);
            return;
        }

        setErro("");
        setResultados(buscarCifras(termo));
    }

    return (
        <>
            <Barra onBuscar={buscar}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                    placeholder="Pesquise uma música ou artista para encontrar a cifra..."
                    aria-label="Buscar cifra"
                    autoComplete="off"
                    spellCheck="false"
                />
            </Barra>

            {erro && <div className="erro">{erro}</div>}

            {resultados && <ChordResults resultados={resultados} />}
        </>
    );
}
