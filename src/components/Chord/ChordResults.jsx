import React from "react";
import PrettyPanel from "../PrettyPanel";
import { registrarAcessoCifra } from "../../utils/recentAccess";
import { registrarEvento } from "../../utils/usageStats";
import { formaPorNome } from "../../utils/acordes";

export default function ChordResults({ resultados, setPage, onMostrarAcorde }) {
    if (!resultados || resultados.length === 0) {
        return <PrettyPanel><span className="subtitulo">Nenhum item do catálogo local corresponde à busca.</span></PrettyPanel>;
    }

    return (
        <div className="lista-resultados">
            <div className="catalogo-aviso">Resultados do catálogo local · conteúdo original ou tradicional com licença indicada</div>
            {resultados.map((r) => (
                <PrettyPanel key={r.id || r.title}>
                    <div className="resultado-cifra">
                        <div>
                            <strong>{r.title}</strong>
                            <div className="fonte">{r.kind} · {r.artist}</div>
                        </div>
                        <span className="tab-difficulty">{r.difficulty}</span>
                    </div>
                    <div className="resultado-chords"><strong>Acordes:</strong> {r.chords.join(" · ")}</div>
                    {onMostrarAcorde && r.chords.filter((acorde) => formaPorNome(acorde)).map((acorde) => (
                        <button
                            key={`${r.id || r.title}-${acorde}`}
                            type="button"
                            className="link-botao chord-preview-button"
                            onClick={() => onMostrarAcorde(acorde)}
                        >
                            Mostrar {acorde} no braço
                        </button>
                    ))}
                    <pre className="tab-pre tab-pre-compact">{r.tab}</pre>
                    <div className="resultado-licenca">{r.license}</div>
                    <a
                        href="#tablaturas"
                        className="link-botao"
                        onClick={(event) => {
                            event.preventDefault();
                            registrarAcessoCifra(r);
                            registrarEvento("result_opened", { fonte: "catalogo-local" });
                            registrarEvento("first_value_reached", { via: "cifra" }, { umaVezPorSessao: true });
                            setPage?.("Tablaturas");
                        }}
                    >
                        Ver no catálogo
                    </a>
                </PrettyPanel>
            ))}
        </div>
    );
}
