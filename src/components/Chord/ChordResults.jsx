// src/components/Chord/ChordResults.jsx
// Lista de resultados da busca de cifras. Cada resultado aponta para a
// fonte original (Cifra Club, Vagalume, Google) — o Riff Theory nunca
// reproduz o conteúdo da cifra em si, só ajuda a encontrar e abrir a fonte.

import React from "react";
import PrettyPanel from "../PrettyPanel";
import { registrarAcessoCifra } from "../../utils/recentAccess";
import { registrarEvento } from "../../utils/usageStats";

export default function ChordResults({ resultados }) {
    if (!resultados || resultados.length === 0) {
        return (
            <PrettyPanel>
                <span className="subtitulo">Nenhum resultado encontrado.</span>
            </PrettyPanel>
        );
    }

    return (
        <div className="lista-resultados">
            {resultados.map((r, i) => (
                <PrettyPanel key={i}>
                    <div className="resultado-cifra">
                        <div>
                            <strong>{r.title}</strong>
                            <div className="fonte">Fonte: {r.source}</div>
                        </div>

                        <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-botao"
                            onClick={() => {
                                registrarAcessoCifra(r);
                                registrarEvento("result_opened", { fonte: r.source });
                                registrarEvento("first_value_reached", { via: "cifra" }, { umaVezPorSessao: true });
                            }}
                        >
                            Abrir
                        </a>
                    </div>
                </PrettyPanel>
            ))}
        </div>
    );
}
