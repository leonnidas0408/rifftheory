import React from "react";
import PrettyPanel from "../PrettyPanel";
import BracoInterativo from "../BracoInterativo";
import ChordSearch from "../Chord/ChordSearch";
import { obterUsoSemanal, obterTotalHorasSemana } from "../../utils/usageStats";
import { obterAcessosRecentes } from "../../utils/recentAccess";

export default function Home() {
    const usoSemanal = obterUsoSemanal();
    const totalHoras = obterTotalHorasSemana();
    const maxMinutos = Math.max(...usoSemanal.map((d) => d.minutos), 1);
    const acessosRecentes = obterAcessosRecentes();

    return (
        <div className="pagina">
            <ChordSearch />

            <BracoInterativo dica="Clique em uma nota para ver sua posição no braço e a escala selecionada." />

            <div className="grade-stats">
                <PrettyPanel>
                    <div className="stats-topo">
                        <div>
                            <h3>Semanas de uso</h3>
                            <span className="subtitulo">Tempo de utilização</span>
                        </div>
                        <strong className="stats-total">{totalHoras.toFixed(1)}h</strong>
                    </div>

                    <div className="stat-grafico">
                        {usoSemanal.map((dia, index) => (
                            <div
                                key={index}
                                className="stat-bar"
                                style={{ height: `${(dia.minutos / maxMinutos) * 100}%` }}
                            />
                        ))}
                    </div>

                    <div className="stat-dias">
                        {usoSemanal.map((dia, index) => (
                            <span key={index}>{dia.label}</span>
                        ))}
                    </div>
                </PrettyPanel>

                <PrettyPanel>
                    <div>
                        <h3>Últimos acessos</h3>
                        <span className="subtitulo">Cifras que você abriu recentemente</span>
                    </div>

                    <div className="recentes">
                        {acessosRecentes.length === 0 ? (
                            <div className="recent-item">
                                <span>Nenhuma cifra aberta ainda</span>
                                <span className="fonte">—</span>
                            </div>
                        ) : (
                            acessosRecentes.map((acesso, index) => (
                                <a
                                    key={index}
                                    href={acesso.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="recent-item"
                                >
                                    <span>{acesso.title}</span>
                                    <span className="fonte">{acesso.source}</span>
                                </a>
                            ))
                        )}
                    </div>
                </PrettyPanel>
            </div>
        </div>
    );
}
