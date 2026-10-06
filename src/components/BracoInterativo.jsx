import React, { useEffect, useRef, useState } from "react";
import PrettyPanel from "./PrettyPanel";
import Braco from "./Braco";
import DiagramaAcorde from "./DiagramaAcorde";
import Icone from "./Icone";
import { atualizarBraco, carregarPreset, limparBraco, moverJanela } from "../draw";
import { formaDoAcorde, formaPorNome } from "../utils/acordes";
import { registrarEvento } from "../utils/usageStats";
import NOTAS from "../assets/constants/NOTAS.json";

const PASSOS_PARA_CONCLUIR = 3;
const CHAVE_TUTORIAL_OCULTO = "riffTheoryTutorialOculto";

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

function tutorialOcultoParaSempre() {
    try {
        return localStorage.getItem(CHAVE_TUTORIAL_OCULTO) === "1";
    } catch {
        return false;
    }
}

/**
 * Props do fluxo guiado (todas opcionais — sem elas o braço se comporta como antes):
 *  - guiado: liga estado demonstrativo, dicas por etapa e confirmação de progresso
 *  - acordeInicial: acorde mostrado enquanto o braço ainda está vazio (ex: "C")
 *  - iniciarTrilha: { acordes: [...], k } — carrega o 1º acorde e habilita "Ver próximo acorde"
 *  - abrirEscolha: contador; ao mudar, abre a grade "Escolher um acorde"
 *  - onVerEscalas: ação do CTA "Explorar escalas relacionadas"
 */
export default function BracoInterativo({
    titulo = "Braço interativo",
    dica,
    onAcordeAvulso,
    guiado = false,
    acordeInicial,
    iniciarTrilha,
    abrirEscolha,
    onVerEscalas,
}) {
    const [mostrarNotas, setMostrarNotas] = useState(!!window.mostrarNotas);
    const [todos, setTodos] = useState(false);
    const [demo, setDemo] = useState(false);
    const [atual, setAtual] = useState(null);
    const [trilha, setTrilha] = useState(null);
    const [passos, setPassos] = useState(0);
    const [concluida, setConcluida] = useState(false);
    const [dicaOculta, setDicaOculta] = useState(tutorialOcultoParaSempre);
    const passosRef = useRef(0);
    const ultimoInicio = useRef(0);
    const ultimaEscolha = useRef(abrirEscolha);

    // Estado inicial demonstrativo: o braço nunca começa visualmente vazio.
    useEffect(() => {
        if (!guiado || !acordeInicial) return;
        const vazio = Object.values(window.estado).every((c) => c.muted);
        if (!vazio) return;
        carregarPreset(formaPorNome(acordeInicial));
        setAtual(acordeInicial);
        setDemo(true);
    }, []);

    useEffect(() => {
        if (abrirEscolha === ultimaEscolha.current) return;
        ultimaEscolha.current = abrirEscolha;
        setTodos(true);
    }, [abrirEscolha]);

    useEffect(() => {
        if (!iniciarTrilha || iniciarTrilha.k === ultimoInicio.current) return;
        ultimoInicio.current = iniciarTrilha.k;
        passosRef.current = 0;
        setPassos(0);
        setConcluida(false);
        setDemo(false);
        setTrilha({ acordes: iniciarTrilha.acordes, i: 0 });
        mostrarAcorde(iniciarTrilha.acordes[0], 0, "trilha");
    }, [iniciarTrilha]);

    function alternarNotas() {
        window.mostrarNotas = !mostrarNotas;
        setMostrarNotas(!mostrarNotas);
        atualizarBraco();
    }

    // Registra um passo útil; ao chegar em 3, confirma o progresso da sessão.
    function contarPasso() {
        const total = ++passosRef.current;
        setPassos(total);
        if (total >= PASSOS_PARA_CONCLUIR) {
            if (registrarEvento("session_completed", { passos: total }, { umaVezPorSessao: true })) {
                setConcluida(true);
            }
        }
    }

    function mostrarAcorde(nome, indice, via) {
        carregarPreset(formaPorNome(nome));
        setAtual(nome);
        registrarEvento("chord_selected", { acorde: nome, via });
        registrarEvento("first_value_reached", { via: "braco" }, { umaVezPorSessao: true });
        contarPasso();
    }

    function escolher(nome, forma) {
        if (forma) carregarPreset(forma);
        else limparBraco();
        setDemo(false);
        setTrilha(null);
        setAtual(nome);
        registrarEvento("chord_selected", { acorde: nome, via: "grade" });
        registrarEvento("first_value_reached", { via: "braco" }, { umaVezPorSessao: true });
        contarPasso();
        onAcordeAvulso?.(nome);
    }

    function proximoAcorde() {
        const i = trilha.i + 1;
        setTrilha({ ...trilha, i });
        registrarEvento("next_step_clicked", { acorde: trilha.acordes[i] });
        mostrarAcorde(trilha.acordes[i], i, "trilha");
    }

    function aoInteragir() {
        setDemo(false);
        registrarEvento("fretboard_note_clicked");
    }

    function ocultarDicaParaSempre() {
        try {
            localStorage.setItem(CHAVE_TUTORIAL_OCULTO, "1");
        } catch {
            // localStorage indisponível — vale só para esta sessão
        }
        setDicaOculta(true);
    }

    const proximo = trilha && trilha.i < trilha.acordes.length - 1 ? trilha.acordes[trilha.i + 1] : null;

    let textoDica = dica ?? "Clique nas casas para montar um acorde. Toque na lateral de uma corda para soltá-la ou abafá-la.";
    if (guiado) {
        textoDica = demo
            ? "Clique em uma casa para ver a nota. Depois, escolha um acorde para visualizar a forma completa."
            : passos > 0
                ? "Primeiro resultado desbloqueado: você já pode tocar este acorde e avançar para o próximo."
                : textoDica;
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
                        Escolher um acorde
                    </button>
                </div>
            </div>

            {demo && (
                <p className="braco-exemplo">
                    Exemplo: {atual}. Clique nas casas para mexer ou escolha outro acorde.
                </p>
            )}

            <div className="braco-info">
                <span id="braco-nome">—</span>
                <span id="braco-notas" />
            </div>

            <div className="braco-scroll">
                <Braco onInteragir={aoInteragir} />
            </div>

            <div className="braco-controles">
                <button onClick={() => moverJanela(-1)}>‹ casa</button>
                <span id="braco-janela">Aberta</span>
                <button onClick={() => moverJanela(1)}>casa ›</button>
                <button className="limpar" onClick={limparBraco}>limpar</button>
            </div>

            {proximo && (
                <button className="link-botao proximo-acorde" onClick={proximoAcorde}>
                    Ver próximo acorde: {proximo}
                </button>
            )}

            {concluida && guiado && (
                <div className="conquista" role="status">
                    <strong>Sessão concluída: você passou por {passos} acordes.</strong>
                    <span className="subtitulo">
                        Continue pelas escalas que combinam com eles ou repita para fixar.
                    </span>
                    <div className="braco-acoes">
                        {onVerEscalas && (
                            <button className="pilula ligada" onClick={onVerEscalas}>
                                Explorar escalas relacionadas
                            </button>
                        )}
                        <button
                            className="pilula"
                            onClick={() => {
                                setConcluida(false);
                                passosRef.current = 0;
                                setPassos(0);
                            }}
                        >
                            Repetir
                        </button>
                    </div>
                </div>
            )}

            {todos && <TodosAcordes onEscolher={escolher} />}

            {!(guiado && dicaOculta) && (
                <div className="dica-bloco">
                    <p className="dica">
                        <Icone nome="info" tamanho={18} />
                        {textoDica}
                    </p>
                    {guiado && (
                        <div className="dica-acoes">
                            <button onClick={() => setDicaOculta(true)}>Pular dicas</button>
                            <button onClick={ocultarDicaParaSempre}>Não mostrar novamente</button>
                        </div>
                    )}
                </div>
            )}
        </PrettyPanel>
    );
}
