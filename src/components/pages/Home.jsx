import React from "react";
import PrettyPanel from "../PrettyPanel";
import Braco from "../Braco";
import ChordSearch from "../ChordSearch";

export default function Home({ setPage }) {
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


            {/* BANNERS */}
            <PrettyPanel>
                <div style={{
                    height: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center"
                }}>
                    <div>
                        <h2 style={{ margin: "0 0 8px" }}>
                            Banners
                        </h2>

                        <span>
                            Novidades, dicas e conteúdos do Riff Theory
                        </span>
                    </div>
                </div>
            </PrettyPanel>


            {/* 3 PILARES */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
                marginTop: "18px"
            }}>

                <PrettyPanel>
                    <h3>🎙 Afinador</h3>

                    <span>
                        Afine seus instrumentos
                    </span>

                    <button
                        className="highlight"
                        onClick={() => setPage("Afinador")}
                    >
                        Abrir →
                    </button>
                </PrettyPanel>


                <PrettyPanel>
                    <h3>⏱ Metrônomo</h3>

                    <span>
                        Treine seu tempo
                    </span>

                    <button
                        className="highlight"
                        onClick={() => setPage("Metrônomo")}
                    >
                        Abrir →
                    </button>
                </PrettyPanel>


                <PrettyPanel>
                    <h3>🎸 Escalas</h3>

                    <span>
                        Crie escalas e acordes
                    </span>

                    <button
                        className="highlight"
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
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "18px",
                marginTop: "18px"
            }}>


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
                            0h
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

                        {[35, 60, 45, 80, 55, 70, 90].map((height, index) => (
                            <div
                                key={index}
                                style={{
                                    width: "11%",
                                    height: `${height}%`,
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
                        <span>Seg</span>
                        <span>Ter</span>
                        <span>Qua</span>
                        <span>Qui</span>
                        <span>Sex</span>
                        <span>Sáb</span>
                        <span>Dom</span>
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

                    </div>

                </PrettyPanel>

            </div>

        </div>
    );
}