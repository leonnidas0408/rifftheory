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

function rolarPara(id) {
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

export default function Home({ setPage }) {
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
        <div className="pagina">
            <section className="hero">
                <div className="hero-kicker">Seu estúdio de guitarra em um só fluxo</div>
                <h1>Toque a próxima música entendendo o que está no braço.</h1>
                <p>
                    Encontre uma cifra, veja os acordes no braço e descubra formas mais fáceis de
                    tocar em minutos — sem alternar entre várias ferramentas.
                </p>
                <div className="hero-acoes">
                    <button
                        className="link-botao hero-cta"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "musica" });
                            focarBusca();
                        }}
                    >
                        Começar com uma música
                    </button>
                    <button
                        className="hero-secundaria"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "acordes" });
                            abrirAcordes();
                        }}
                    >
                        Explorar acordes
                    </button>
                </div>
                <div className="hero-seguranca">
                    <span className="seguranca-icone" aria-hidden="true">✓</span>
                    <span>Sem cadastro. Seu histórico fica salvo apenas neste navegador.</span>
                </div>
            </section>

            <section className="prova-valor" aria-label="Por que usar o Riff Theory">
                <div className="prova-intro">
                    <span className="eyebrow">Um caminho mais curto para praticar</span>
                    <h2>Da música ao braço em um único lugar</h2>
                    <p>O Riff Theory conecta a descoberta à prática: você não precisa copiar acordes entre abas nem abandonar a música para estudar a teoria.</p>
                </div>
                <div className="prova-numeros">
                    <div className="prova-numero"><strong>12</strong><span>notas para montar qualquer acorde</span></div>
                    <div className="prova-numero"><strong>3</strong><span>passos para concluir uma sessão guiada</span></div>
                    <div className="prova-numero"><strong>7</strong><span>dias de progresso acompanhados no app</span></div>
                </div>
                <div className="prova-recursos">
                    <div><strong>1. Busque</strong><span>Encontre cifras por música ou artista.</span></div>
                    <div><strong>2. Veja</strong><span>Visualize a forma no braço interativo.</span></div>
                    <div><strong>3. Toque</strong><span>Avance por acordes, escalas e prática.</span></div>
                </div>
            </section>

            <div id="comecar" className="comecar">
                <div className="comecar-topo">
                    <h2>Escolha um ponto de partida</h2>
                    <span className="subtitulo">Você pode mudar de caminho a qualquer momento.</span>
                    <div className="braco-acoes">
                        <button className="pilula ligada" onClick={focarBusca}>
                            Quero tocar uma música
                        </button>
                        <button className="pilula" onClick={abrirAcordes}>
                            Quero aprender um acorde
                        </button>
                        <button className="pilula" onClick={() => setPage?.("Escalas")}>
                            Quero entender uma escala
                        </button>
                    </div>
                    <p className="cta-seguranca"><strong>Comece sem compromisso:</strong> não criamos conta, não pedimos cartão e você pode praticar direto no navegador.</p>
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
                            <h3>Progresso desta semana</h3>
                            <span className="subtitulo">O que você descobriu nos últimos 7 dias</span>
                        </div>
                        <strong className="stats-total">{totalHoras.toFixed(1)}h</strong>
                    </div>

                    {semProgresso ? (
                        <div className="estado-vazio">
                            <span>
                                Você ainda não concluiu uma sessão. Faça uma descoberta rápida de 2
                                minutos.
                            </span>
                            <button className="link-botao" onClick={() => iniciarTrilha(PROGRESSOES[0])}>
                                Começar prática rápida
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
                                    Explorar uma música
                                </button>
                            </div>
                        )}
                    </div>
                </PrettyPanel>
            </div>
        </div>
    );
}
