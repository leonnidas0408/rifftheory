import { useMemo, useState } from "react";
import NOTAS from "../assets/constants/NOTAS.json";

const TECLAS_PRETAS = new Set([1, 3, 6, 8, 10]);
const TECLAS_SAX = [
    ["B3", "Si grave"], ["C4", "Dó"], ["D4", "Ré"], ["E4", "Mi"], ["F4", "Fá"], ["G4", "Sol"],
    ["A4", "Lá"], ["B4", "Si"], ["C5", "Dó agudo"], ["D5", "Ré agudo"], ["E5", "Mi agudo"],
];

function nomeMidi(midi) {
    return `${NOTAS[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function Teclado({ instrumento, onInteragir }) {
    const [tocadas, setTocadas] = useState([]);
    const teclas = useMemo(() => Array.from({ length: instrumento.keyCount }, (_, i) => instrumento.startMidi + i), [instrumento]);

    function alternar(midi) {
        setTocadas((atuais) => atuais.includes(midi) ? atuais.filter((item) => item !== midi) : [...atuais, midi]);
        onInteragir?.();
    }

    return (
        <div className="instrumento-visualizador teclado-visualizador">
            <div className="visualizador-legenda">
                <span>Toque nas teclas para montar notas e acordes</span>
                <strong>{tocadas.length ? tocadas.map(nomeMidi).join(" · ") : "Nenhuma tecla selecionada"}</strong>
            </div>
            <div className="teclado" role="group" aria-label={`${instrumento.label} interativo`}>
                {teclas.map((midi) => {
                    const grau = midi % 12;
                    const preta = TECLAS_PRETAS.has(grau);
                    return (
                        <button
                            key={midi}
                            type="button"
                            className={`tecla ${preta ? "tecla-preta" : "tecla-branca"}${tocadas.includes(midi) ? " selecionada" : ""}`}
                            onClick={() => alternar(midi)}
                            aria-label={`Tecla ${nomeMidi(midi)}`}
                            aria-pressed={tocadas.includes(midi)}
                        >
                            {!preta && <span>{nomeMidi(midi)}</span>}
                        </button>
                    );
                })}
            </div>
            <button className="visualizador-limpar" type="button" onClick={() => setTocadas([])} disabled={!tocadas.length}>Limpar teclas</button>
        </div>
    );
}

function Saxofone({ onInteragir }) {
    const [tocadas, setTocadas] = useState([]);

    function alternar(nota) {
        setTocadas((atuais) => atuais.includes(nota) ? atuais.filter((item) => item !== nota) : [...atuais, nota]);
        onInteragir?.();
    }

    return (
        <div className="instrumento-visualizador sax-visualizador">
            <div className="visualizador-legenda">
                <span>Mapa de digitação básica</span>
                <strong>{tocadas.length ? tocadas.join(" · ") : "Selecione uma nota para ver a digitação"}</strong>
            </div>
            <div className="sax-corpo" aria-label="Digitação básica do saxofone">
                <div className="sax-bocal" aria-hidden="true">Bocal</div>
                <div className="sax-furos">
                    {TECLAS_SAX.map(([nota, descricao]) => (
                        <button
                            key={nota}
                            type="button"
                            className={`sax-furo${tocadas.includes(nota) ? " selecionado" : ""}`}
                            onClick={() => alternar(nota)}
                            aria-label={`${nota}, ${descricao}`}
                            aria-pressed={tocadas.includes(nota)}
                        >
                            <span>{nota}</span>
                            <small>{descricao}</small>
                        </button>
                    ))}
                </div>
                <div className="sax-campana" aria-hidden="true">Campana</div>
            </div>
            <p className="visualizador-nota">A digitação exibida é uma referência inicial para estudo; articulação, oitava e afinação dependem do sax e da embocadura.</p>
            <button className="visualizador-limpar" type="button" onClick={() => setTocadas([])} disabled={!tocadas.length}>Limpar seleção</button>
        </div>
    );
}

export default function InstrumentoVisualizador({ instrumento, onInteragir }) {
    if (instrumento.type === "keys") return <Teclado instrumento={instrumento} onInteragir={onInteragir} />;
    if (instrumento.type === "wind") return <Saxofone onInteragir={onInteragir} />;
    return null;
}
