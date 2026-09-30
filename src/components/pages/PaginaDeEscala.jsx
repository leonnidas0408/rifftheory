import React, { useEffect, useState } from "react";
import Barra from "../Barra";
import PrettyPanel from "../PrettyPanel";
import BracoInterativo from "../BracoInterativo";
import DiagramaAcorde from "../DiagramaAcorde";
import Icone from "../Icone";
import { parsear, calcEscala, calcCampoHarmonico } from "../../util";
import { carregarPreset, limparBraco } from "../../draw";
import { formaDoAcorde } from "../../utils/acordes";
import ESTILOS from "../../assets/constants/ESTILOS.json";

// Ordem dos modos a partir do Jônio (maior). Cada rotação de uma escala de
// 7 notas forma um dos modos, na mesma ordem cíclica.
const MODOS = ["ionico", "dorico", "frigio", "lidio", "mixolidio", "eolio", "locrio"];

const NOME_MODO = {
    ionico: "Jônio",
    dorico: "Dórico",
    frigio: "Frígio",
    lidio: "Lídio",
    mixolidio: "Mixolídio",
    eolio: "Eólio",
    locrio: "Lócrio",
};

const NOME_ESCALA = {
    maior: "maior",
    menor: "menor natural",
    menor_harmonica: "menor harmônica",
    menor_melodica: "menor melódica",
    pentatonica_maior: "pentatônica maior",
    pentatonica_menor: "pentatônica menor",
    blues: "blues",
    tons_inteiros: "tons inteiros",
    cromatica: "cromática",
    diminuta: "diminuta",
    aumentada: "aumentada",
};

// posição da escala dentro do ciclo de modos (-1 = não é modal)
function indiceModo(tipo) {
    if (tipo === "maior") return 0;
    if (tipo === "menor") return 5;
    return MODOS.indexOf(tipo);
}

function nomeDaEscala({ nota, tipo }) {
    if (MODOS.includes(tipo)) {
        const modo = `${nota} ${NOME_MODO[tipo]}`;
        if (tipo === "ionico") return `${nota} maior (${modo})`;
        if (tipo === "eolio") return `${nota} menor natural (${modo})`;
        return modo;
    }
    return `${nota} ${NOME_ESCALA[tipo] ?? tipo}`;
}

export default function PaginaDeEscala() {
    const [texto, setTexto] = useState("");
    const [erro, setErro] = useState("");
    const [escala, setEscala] = useState({ nota: "E", tipo: "menor" });
    const [rotacao, setRotacao] = useState(0);
    const [acorde, setAcorde] = useState(0);
    const [avulso, setAvulso] = useState(null);

    const notasBase = calcEscala(escala.nota, escala.tipo);
    const inicio = indiceModo(escala.tipo);
    const modal = inicio >= 0;

    const atual = modal
        ? { nota: notasBase[rotacao], tipo: MODOS[(inicio + rotacao) % 7] }
        : escala;

    const notas = calcEscala(atual.nota, atual.tipo);
    const campo = calcCampoHarmonico(atual.nota, atual.tipo);

    function formaDoGrau(grau) {
        return formaDoAcorde(grau.raiz, grau.qualidade);
    }

    function abrirNoBraco(grau) {
        const forma = grau ? formaDoGrau(grau) : null;
        if (forma) carregarPreset(forma);
        else limparBraco();
    }

    // ao trocar de escala ou modo, abre o 1º acorde do campo harmônico
    useEffect(() => {
        setAcorde(0);
        setAvulso(null);
        abrirNoBraco(campo ? campo[0] : null);
    }, [atual.nota, atual.tipo]);

    function escolherAcorde(indice) {
        setAcorde(indice);
        setAvulso(null);
        abrirNoBraco(campo[indice]);
    }

    function buscar() {
        const resultado = parsear(texto);
        if (!resultado) {
            setErro("Escala não reconhecida. Exemplos: E menor, C maior, A dórico.");
            return;
        }
        setErro("");
        setEscala({ nota: resultado[0], tipo: resultado[1] });
        setRotacao(0);
    }

    const tituloBraco = avulso
        ? `Braço interativo — ${avulso}`
        : campo
            ? `Braço interativo — ${campo[acorde].simbolo} (${campo[acorde].romano} grau)`
            : "Braço interativo";

    return (
        <div className="pagina">
            <Barra onBuscar={buscar} botaoBusca>
                <input
                    type="text"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                    placeholder="digite a escala (ex: E menor, C maior, A dórico...)"
                    aria-label="Buscar escala"
                    autoComplete="off"
                    spellCheck="false"
                />
            </Barra>
            {erro && <div className="erro">{erro}</div>}

            <PrettyPanel>
                <div className="escala-topo">
                    <div>
                        <h2>{nomeDaEscala(atual)}</h2>
                        <p className="escala-notas">Notas: {notas.join("  ")}</p>
                    </div>

                    <div className="escala-selos">
                        <span className="selo">
                            {modal
                                ? `Modo: ${NOME_MODO[atual.tipo]}`
                                : ESTILOS[atual.tipo] ?? "Vários estilos"}
                        </span>
                        {campo && (
                            <span className="selo">
                                <Icone nome="riffs" tamanho={18} />
                                {campo.length} acordes
                            </span>
                        )}
                    </div>
                </div>

                {modal && (
                    <div className="modos" role="tablist" aria-label="Modos da escala">
                        {notasBase.map((nota, i) => (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={rotacao === i}
                                className={`modo${rotacao === i ? " ativo" : ""}`}
                                onClick={() => setRotacao(i)}
                            >
                                {nota} {NOME_MODO[MODOS[(inicio + i) % 7]]}
                            </button>
                        ))}
                    </div>
                )}

                <h3>Acordes da escala</h3>

                {campo ? (
                    <div className="acordes">
                        {campo.map((grau, i) => (
                            <button
                                key={i}
                                className={`acorde-card${i === acorde && !avulso ? " ativo" : ""}`}
                                onClick={() => escolherAcorde(i)}
                            >
                                <span className="acorde-nome">{grau.simbolo}</span>
                                <DiagramaAcorde forma={formaDoGrau(grau)} />
                                <span className="acorde-grau">({grau.romano})</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="subtitulo">
                        Esta escala tem {notas.length} notas e não forma um campo harmônico
                        por terças. Use o braço abaixo para explorar as posições.
                    </p>
                )}
            </PrettyPanel>

            <BracoInterativo
                titulo={tituloBraco}
                onAcordeAvulso={setAvulso}
                dica="Clique em um acorde para ver sua posição no braço e as notas que ele contém."
            />
        </div>
    );
}
