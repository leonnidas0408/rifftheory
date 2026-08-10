import React from "react";
import PrettyPanel from "../PrettyPanel";
import Braco from "../Braco";
import ChordSearch from "../ChordSearch";
import { obterUsoSemanal, obterTotalHorasSemana } from "../../utils/usageStats";
import { obterAcessosRecentes } from "../../utils/recentAccess";

export default function Home({ setPage }) {
    const usoSemanal = obterUsoSemanal();
    const totalHoras = obterTotalHorasSemana();
    const maxMinutos = Math.max(...usoSemanal.map((d) => d.minutos), 1);
    const acessosRecentes = obterAcessosRecentes();

    return (
        <div style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "20px",
            boxSizing: "border-box"
        }}>

            {/* BARRA DE PESQUISA */}
            <div style={{
                width: "100%",
                marginBottom: "18px"
            }}>
                <ChordSearch />
            </div>


            {/* BANNER */}
            <div style={{
                width: "100%",
                borderRadius: "22px",
                overflow: "hidden",
                border: "1px solid rgba(74,141,249,.35)",
                boxShadow: "0 0 20px rgba(74,141,249,.10)",
                margin: "10px 10px 0"
            }}>
                <img
                    src="/banner-hero.png"
                    alt="Riff Theory — Crie, estude, evolua"
                    style={{
                        width: "100%",
                        display: "block",
                        objectFit: "cover"
                    }}
                />
            </div>


            {/* 3 PILARES */}
            <div className="pilares-grid">

                <PrettyPanel>
                    <div className="feature-icon feature-icon-blue">🎙</div>
                    <h3 style={{ fontSize: "17px" }}>Afinador</h3>

                    <span style={{ opacity: 0.65, fontSize: "13px" }}>
                        Afine seus instrumentos pelo microfone
                    </span>

                    <button
                        className="highlight"
                        style={{ marginTop: "auto", alignSelf: "flex-start" }}
                        onClick={() => setPage("Afinador")}
                    >
                        Abrir →
                    </button>
                </PrettyPanel>


                <PrettyPanel>
                    <div className="feature-icon feature-icon-purple">⏱</div>
                    <h3 style={{ fontSize: "17px" }}>Metrônomo</h3>

                    <span style={{ opacity: 0.65, fontSize: "13px" }}>
                        Marque o tempo e treine sua precisão
                    </span>

                    <button
                        className="highlight"
                        style={{ marginTop: "auto", alignSelf: "flex-start" }}
                        onClick={() => setPage("Metrônomo")}
                    >
                        Abrir →
                    </button>
                </PrettyPanel>


                <PrettyPanel>
                    <div className="feature-icon feature-icon-blue">🎸</div>
                    <h3 style={{ fontSize: "17px" }}>Escalas</h3>

                    <span style={{ opacity: 0.65, fontSize: "13px" }}>
                        Crie escalas, acordes e progressões
                    </span>

                    <button
                        className="highlight"
                        style={{ marginTop: "auto", alignSelf: "flex-start" }}
                        onClick={() => setPage("Escalas")}
                    >
                        Abrir →
                    </button>
                </PrettyPanel>

            </div>


            {/* BRAÇO INTERATIVO */}
            <div style={{
                marginTop: "18px"
            }}>
                <PrettyPanel>
                    <h3>Braço Interativo</h3>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px"
                    }}>
                        <span id="braco-nome">—</span>
                        <span id="braco-janela">Aberta</span>
                    </div>

                    <div
                        id="braco-notas"
                        style={{
                            minHeight: "20px",
                            marginBottom: "8px",
                            opacity: 0.7
                        }}
                    />

                    <div style={{
                        width: "100%",
                        overflowX: "auto",
                        padding: "10px 0"
                    }}>
                        <Braco />
                    </div>
                </PrettyPanel>
            </div>


            {/* ESTATÍSTICAS */}
            <div className="stats-grid">


                {/* SEMANAS DE USO */}
                <PrettyPanel>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px"
                    }}>
                        <div>
                            <h3 style={{ margin: 0 }}>
                                Semanas de uso
                            </h3>

                            <span>
                                Tempo de utilização
                            </span>
                        </div>

                        <strong style={{
                            fontSize: "22px"
                        }}>
                            {totalHoras.toFixed(1)}h
                        </strong>
                    </div>


                    {/* GRÁFICO */}
                    <div style={{
                        height: "180px",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-around",
                        gap: "10px",
                        padding: "10px 5px 25px",
                        boxSizing: "border-box"
                    }}>

                        {usoSemanal.map((dia, index) => (
                            <div
                                key={index}
                                style={{
                                    width: "11%",
                                    height: `${(dia.minutos / maxMinutos) * 100}%`,
                                    borderRadius: "6px 6px 2px 2px",
                                    background: "var(--dourado, #4a8df9)",
                                    opacity: "0.85"
                                }}
                            />
                        ))}

                    </div>


                    <div style={{
                        display: "flex",
                        justifyContent: "space-around",
                        fontSize: "12px",
                        opacity: 0.65
                    }}>
                        {usoSemanal.map((dia, index) => (
                            <span key={index}>{dia.label}</span>
                        ))}
                    </div>

                </PrettyPanel>


                {/* TREINO DIÁRIO */}
                <PrettyPanel>

                    <h3>
                        Treino diário
                    </h3>

                    <span>
                        Progresso da meta diária
                    </span>


                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "25px"
                    }}>

                        <div style={{
                            width: "150px",
                            height: "150px",
                            borderRadius: "50%",
                            background:
                                "conic-gradient(var(--dourado, #4a8df9) 0% 0%, rgba(255,255,255,0.08) 0% 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>

                            <div style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                background: "var(--carvao, #000203)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column"
                            }}>

                                <strong style={{
                                    fontSize: "28px"
                                }}>
                                    0%
                                </strong>

                                <span style={{
                                    fontSize: "12px",
                                    opacity: 0.65
                                }}>
                                    em breve
                                </span>

                            </div>

                        </div>

                    </div>

                    <div style={{
                        textAlign: "center",
                        opacity: 0.65,
                        fontSize: "13px"
                    }}>
                        O sistema de treino será integrado
                        ao assistente de aprendizado.
                    </div>

                </PrettyPanel>

            </div>


            {/* ÚLTIMOS ACESSOS */}
            <div style={{
                marginTop: "18px"
            }}>

                <PrettyPanel>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px"
                    }}>

                        <div>
                            <h3 style={{ margin: 0 }}>
                                Últimos acessos
                            </h3>

                            <span>
                                Seus conteúdos acessados recentemente
                            </span>
                        </div>

                    </div>


                    {/* ITENS DO HISTÓRICO */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                    }}>

                        {acessosRecentes.length === 0 ? (
                            <>
                                <div style={{
                                    padding: "14px",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.04)",
                                    display: "flex",
                                    justifyContent: "space-between"
                                }}>
                                    <span>
                                        🎸 Nenhum acesso recente
                                    </span>

                                    <span style={{ opacity: 0.5 }}>
                                        —
                                    </span>
                                </div>


                                <div style={{
                                    padding: "14px",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.04)",
                                    display: "flex",
                                    justifyContent: "space-between"
                                }}>
                                    <span>
                                        🔎 Seus acordes e escalas aparecerão aqui
                                    </span>

                                    <span style={{ opacity: 0.5 }}>
                                        —
                                    </span>
                                </div>
                            </>
                        ) : (
                            acessosRecentes.map((acesso, index) => (
                                <a
                                    key={index}
                                    href={acesso.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: "14px",
                                        borderRadius: "10px",
                                        background: "rgba(255,255,255,0.04)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        color: "inherit"
                                    }}
                                >
                                    <span>
                                        🎸 {acesso.title}
                                    </span>

                                    <span style={{ opacity: 0.5, fontSize: "12px" }}>
                                        {acesso.source}
                                    </span>
                                </a>
                            ))
                        )}

                    </div>

                </PrettyPanel>

            </div>

        </div>
    );
}