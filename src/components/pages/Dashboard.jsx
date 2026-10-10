import React, { useEffect, useState } from "react";
import PrettyPanel from "../PrettyPanel";
import BracoInterativo from "../BracoInterativo";
import ChordSearch from "../Chord/ChordSearch";
import {
    obterUsoSemanal,
    obterTotalHorasSemana,
    obterProgressoSemana,
    registrarEvento,
} from "../../utils/usageStats";
import { obterAcessosRecentes } from "../../utils/recentAccess";

// Progressões para treinar sem digitar nada (cada uma vira uma trilha de acordes).
const PROGRESSOES = [
    ["C", "G", "Am", "F"],
    ["Em", "C", "G", "D"],
    ["Am", "F", "C", "G"],
];

const EXEMPLOS_USO = [
    {
        nicho: "Quem está começando",
        antes: "Você sabe o nome do acorde, mas trava na hora de encontrar a forma.",
        depois: "Escolha um acorde e veja sua posição no braço imediatamente, sem sair da prática.",
    },
    {
        nicho: "Quem está montando repertório",
        antes: "Você alterna entre cifra, diagrama e vídeo para lembrar cada troca.",
        depois: "Use uma trilha pronta de acordes para revisar as trocas em sequência no mesmo app.",
    },
    {
        nicho: "Quem quer entender teoria",
        antes: "A escala parece uma lista de notas sem ligação com o que você toca.",
        depois: "Explore a escala, veja os acordes do campo harmônico e teste as formas no braço.",
    },
];

function rolarPara(id) {
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

export default function Dashboard({ setPage }) {
    const [, atualizar] = useState(0);
    const [trilha, setTrilha] = useState(null);
    const [abrirEscolha, setAbrirEscolha] = useState(0);

    // Reavalia os blocos de progresso sempre que um evento do funil é registrado.
    useEffect(() => {
        const aoEvento = () => atualizar((v) => v + 1);
        window.addEventListener("rt:evento", aoEvento);
        registrarEvento("home_viewed");
        return () => window.removeEventListener("rt:evento", aoEvento);
    }, []);

    const usoSemanal = obterUsoSemanal();
    const totalHoras = obterTotalHorasSemana();
    const maxMinutos = Math.max(...usoSemanal.map((d) => d.minutos), 1);
    const acessosRecentes = obterAcessosRecentes();
    const progresso = obterProgressoSemana();
    const semProgresso = progresso.acordes + progresso.musicas + progresso.sessoes === 0;

    function focarBusca() {
        rolarPara("comecar");
        document.getElementById("busca-cifra")?.focus({ preventScroll: true });
    }

    function abrirAcordes() {
        setAbrirEscolha((v) => v + 1);
        rolarPara("secao-braco");
    }

    function iniciarTrilha(acordes) {
        setTrilha({ acordes, k: Date.now() });
        rolarPara("secao-braco");
    }

    function retomar(acorde) {
        registrarEvento("return_session_opened", { acorde });
        iniciarTrilha([acorde]);
    }

    return (
        <div className="pagina"><div id="comecar" className="comecar">
            <div className="comecar-topo">
                <h2>Escolha um ponto de partida</h2>
                <span className="subtitulo">Você pode mudar de caminho a qualquer momento.</span>
                <div className="braco-acoes">
                    <button className="pilula ligada" onClick={focarBusca}>
                        Buscar uma música
                    </button>
                    <button className="pilula" onClick={abrirAcordes}>
                        Ver acordes no braço
                    </button>
                    <button className="pilula" onClick={() => setPage?.("Escalas")}>
                        Explorar escalas
                    </button>
                </div>
                <p className="cta-seguranca"><strong>Comece agora:</strong> escolha uma trilha e veja o primeiro acorde no braço — ou busque uma música quando já souber o que quer tocar.</p>
            </div>
            <ChordSearch />
            <div className="sugestoes">
                <span className="subtitulo">Ou treine uma progressão no braço:</span>
                {PROGRESSOES.map((acordes) => (
                    <button
                        key={acordes.join("-")}
                        className="pilula"
                        onClick={() => iniciarTrilha(acordes)}
                    >
                        {acordes.join(" – ")}
                    </button>
                ))}
            </div>
        </div>
        <div id="secao-braco">
            <BracoInterativo
                guiado
                acordeInicial="C"
                iniciarTrilha={trilha}
                abrirEscolha={abrirEscolha}
                onVerEscalas={() => setPage?.("Escalas")}
            />
        </div>
            <div className="grade-stats">
                <PrettyPanel>
                    <div className="stats-topo">
                        <div>
                            <h3>O que você já praticou</h3>
                            <span className="subtitulo">Resultados da sua prática nos últimos 7 dias</span>
                        </div>
                        <strong className="stats-total">{totalHoras.toFixed(1)}h</strong>
                    </div>

                    {semProgresso ? (
                        <div className="estado-vazio">
                            <span>
                                Você ainda não concluiu uma sessão. Comece agora e veja seu primeiro
                                acorde no braço.
                            </span>
                            <button className="link-botao" onClick={() => iniciarTrilha(PROGRESSOES[0])}>
                                Começar agora
                            </button>
                        </div>
                    ) : (
                        <div className="indicadores">
                            <div><strong>{progresso.acordes}</strong><span>acordes vistos</span></div>
                            <div><strong>{progresso.musicas}</strong><span>músicas exploradas</span></div>
                            <div><strong>{progresso.sessoes}</strong><span>sessões concluídas</span></div>
                            <div><strong>{progresso.sequencia}</strong><span>dias seguidos</span></div>
                        </div>
                    )}

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
                        <h3>Continue de onde parou</h3>
                        <span className="subtitulo">Seu último acorde e as cifras que você abriu</span>
                    </div>

                    <div className="recentes">
                        {progresso.ultimoAcorde && (
                            <button
                                className="recent-item"
                                onClick={() => retomar(progresso.ultimoAcorde)}
                            >
                                <span>Retomar o acorde {progresso.ultimoAcorde}</span>
                                <span className="fonte">Braço</span>
                            </button>
                        )}

                        {acessosRecentes.map((acesso, index) => (
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
                        ))}

                        {!progresso.ultimoAcorde && acessosRecentes.length === 0 && (
                            <div className="estado-vazio">
                                <span>
                                    Seu histórico começa aqui. Explore uma música para criar seu
                                    primeiro atalho.
                                </span>
                                <button className="link-botao" onClick={focarBusca}>
                                    Buscar uma música
                                </button>
                            </div>
                        )}
                    </div>
                </PrettyPanel>
            </div>
            <div className="mobile-cta-wrap">
                <button className="mobile-cta" onClick={() => {
                    registrarEvento("mobile_cta_clicked", { cta: "pratica_guiada" });
                    iniciarTrilha(PROGRESSOES[0]);
                }}>
                    <span>Primeiro acorde em um clique</span>
                    <strong>Começar agora</strong>
                </button>
            </div>
        </div>
    );
}
