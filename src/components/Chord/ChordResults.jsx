import React from "react";
import PrettyPanel from "../PrettyPanel";
import { registrarAcessoCifra } from "../../utils/recentAccess";
import { registrarEvento } from "../../utils/usageStats";

export default function ChordResults({ resultados, setPage }) {
    if (!resultados || resultados.length === 0) {
        return (
            <PrettyPanel>
                <span className="subtitulo">
                    Nenhuma partitura verificada corresponde à busca. Tente “Menuet in G” ou “BWV Anh. 114”.
                </span>
            </PrettyPanel>
        );
    }

    return (
        <div className="lista-resultados">
            <div className="catalogo-aviso">
                Resultado do catálogo local · edição completa com fonte e licença identificadas
            </div>
            {resultados.map((score) => (
                <PrettyPanel key={score.id}>
                    <div className="resultado-cifra">
                        <div>
                            <strong>{score.title}</strong>
                            <div className="fonte">
                                {score.composer} · {score.catalogueNumber}
                            </div>
                        </div>
                        <span className="tab-difficulty">Fonte verificada</span>
                    </div>
                    <div className="resultado-licenca">
                        {score.source} · {score.license}
                    </div>
                    <a
                        href="#tablaturas"
                        className="link-botao"
                        onClick={(event) => {
                            event.preventDefault();
                            registrarAcessoCifra({
                                id: score.id,
                                title: score.title,
                                source: score.source,
                                url: score.url,
                            });
                            registrarEvento("result_opened", { fonte: "partitura-verificada" });
                            registrarEvento("first_value_reached", { via: "tablatura-verificada" }, { umaVezPorSessao: true });
                            setPage?.("Tablaturas");
                        }}
                    >
                        Abrir partitura completa
                    </a>
                </PrettyPanel>
            ))}
        </div>
    );
}
