import React, { useState } from "react";
import PrettyPanel from "./PrettyPanel";
import Braco from "./Braco";
import DiagramaAcorde from "./DiagramaAcorde";
import Icone from "./Icone";
import { atualizarBraco, carregarPreset, limparBraco, moverJanela } from "../draw";
import { formaDoAcorde } from "../utils/acordes";
import NOTAS from "../assets/constants/NOTAS.json";

const QUALIDADES = [
    ["M", "Maiores", ""],
    ["m", "Menores", "m"],
    ["dim", "Diminutos", "°"],
];

function TodosAcordes({ onEscolher }) {
    const [qualidade, setQualidade] = useState("M");
    const sufixo = QUALIDADES.find(([q]) => q === qualidade)[2];

    return (
        <div className="todos-acordes">
            <div className="braco-acoes">
                {QUALIDADES.map(([q, nome]) => (
                    <button
                        key={q}
                        className={`pilula${qualidade === q ? " ligada" : ""}`}
                        onClick={() => setQualidade(q)}
                    >
                        {nome}
                    </button>
                ))}
            </div>

            <div className="todos-grade">
                {NOTAS.map((raiz) => {
                    const forma = formaDoAcorde(raiz, qualidade);
                    const nome = raiz + sufixo;
                    return (
                        <button
                            key={nome}
                            className="acorde-card"
                            onClick={() => onEscolher(nome, forma)}
                        >
                            <span className="acorde-nome">{nome}</span>
                            <DiagramaAcorde forma={forma} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function BracoInterativo({ titulo = "Braço interativo", dica, onAcordeAvulso }) {
    const [mostrarNotas, setMostrarNotas] = useState(!!window.mostrarNotas);
    const [todos, setTodos] = useState(false);

    function alternarNotas() {
        window.mostrarNotas = !mostrarNotas;
        setMostrarNotas(!mostrarNotas);
        atualizarBraco();
    }

    function escolher(nome, forma) {
        if (forma) carregarPreset(forma);
        else limparBraco();
        onAcordeAvulso?.(nome);
    }

    return (
        <PrettyPanel>
            <div className="braco-topo">
                <h2>{titulo}</h2>

                <div className="braco-acoes">
                    <button
                        className={`pilula${mostrarNotas ? " ligada" : ""}`}
                        onClick={alternarNotas}
                    >
                        <Icone nome="olho" tamanho={18} />
                        {mostrarNotas ? "Ocultar notas" : "Mostrar notas"}
                    </button>

                    <button
                        className={`pilula${todos ? " ligada" : ""}`}
                        onClick={() => setTodos((v) => !v)}
                    >
                        <Icone nome="grade" tamanho={18} />
                        Ver todos os acordes
                    </button>
                </div>
            </div>

            <div className="braco-info">
                <span id="braco-nome">—</span>
                <span id="braco-notas" />
            </div>

            <div className="braco-scroll">
                <Braco />
            </div>

            <div className="braco-controles">
                <button onClick={() => moverJanela(-1)}>‹ casa</button>
                <span id="braco-janela">Aberta</span>
                <button onClick={() => moverJanela(1)}>casa ›</button>
                <button className="limpar" onClick={limparBraco}>limpar</button>
            </div>

            {todos && <TodosAcordes onEscolher={escolher} />}

            <p className="dica">
                <Icone nome="info" tamanho={18} />
                {dica ?? "Clique nas casas para montar um acorde. Toque na lateral de uma corda para soltá-la ou abafá-la."}
            </p>
        </PrettyPanel>
    );
}
