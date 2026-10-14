import { useEffect, useMemo, useRef, useState } from "react";
import NOTAS from "../assets/constants/NOTAS.json";

const TECLAS_PRETAS = new Set([1, 3, 6, 8, 10]);
const MAPA_TECLADO = "awsedftgyhujkolp;";
const ROTULOS_NOTAS = [
    ["Dó"], ["Dó#", "Réb"], ["Ré"], ["Ré#", "Mib"], ["Mi"], ["Fá"],
    ["Fá#", "Solb"], ["Sol"], ["Sol#", "Láb"], ["Lá"], ["Lá#", "Sib"], ["Si"],
];

function nomeMidi(midi) {
    return `${NOTAS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function tocarNota(midi, duracao = 0.8, tipo = "sine") {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const contexto = new AudioContext();
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    oscilador.type = tipo;
    oscilador.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    ganho.gain.setValueAtTime(0.0001, contexto.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.18, contexto.currentTime + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + duracao);
    oscilador.connect(ganho).connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + duracao + 0.05);
    oscilador.addEventListener("ended", () => contexto.close());
}

function Teclado({ instrumento, onInteragir }) {
    const [oitava, setOitava] = useState(0);
    const [ativas, setAtivas] = useState([]);
    const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
    const [sustain, setSustain] = useState(false);
    const teclas = useMemo(
        () => Array.from({ length: instrumento.keyCount }, (_, i) => instrumento.startMidi + oitava * 12 + i),
        [instrumento, oitava],
    );
    const tocadasRef = useRef(new Map());

    function pressionar(midi, soltar = false) {
        if (soltar && sustain) return;
        if (soltar) {
            setAtivas((atuais) => atuais.filter((item) => item !== midi));
            return;
        }
        setAtivas((atuais) => atuais.includes(midi) ? atuais : [...atuais, midi]);
        tocarNota(midi, sustain ? 2.2 : 0.8, "triangle");
        onInteragir?.();
    }

    useEffect(() => {
        function aoPressionar(evento) {
            if (evento.repeat) return;
            const indice = MAPA_TECLADO.indexOf(evento.key.toLowerCase());
            if (indice < 0 || indice >= teclas.length) return;
            evento.preventDefault();
            const midi = teclas[indice];
            tocadasRef.current.set(evento.key.toLowerCase(), midi);
            pressionar(midi);
        }
        function aoSoltar(evento) {
            const midi = tocadasRef.current.get(evento.key.toLowerCase());
            if (midi === undefined) return;
            tocadasRef.current.delete(evento.key.toLowerCase());
            pressionar(midi, true);
        }
        window.addEventListener("keydown", aoPressionar);
        window.addEventListener("keyup", aoSoltar);
        return () => {
            window.removeEventListener("keydown", aoPressionar);
            window.removeEventListener("keyup", aoSoltar);
        };
    });

    function limpar() {
        setAtivas([]);
        tocadasRef.current.clear();
    }

    return (
        <div className="instrumento-visualizador teclado-visualizador">
            <div className="instrumento-toolbar">
                <div className="instrumento-toolbar-grupo">
                    <button type="button" className="controle-mini" onClick={() => setOitava((valor) => Math.max(-2, valor - 1))} aria-label="Descer oitava">−</button>
                    <span className="controle-status">Oitava {oitava >= 0 ? "+" : ""}{oitava}</span>
                    <button type="button" className="controle-mini" onClick={() => setOitava((valor) => Math.min(2, valor + 1))} aria-label="Subir oitava">+</button>
                </div>
                <button type="button" className={`controle-toggle${sustain ? " ativo" : ""}`} onClick={() => setSustain((valor) => !valor)} aria-pressed={sustain}>Sustain {sustain ? "ligado" : "desligado"}</button>
                <button type="button" className={`controle-toggle${mostrarAtalhos ? " ativo" : ""}`} onClick={() => setMostrarAtalhos((valor) => !valor)} aria-pressed={mostrarAtalhos}>Atalhos</button>
            </div>
            <div className="visualizador-legenda">
                <span>Toque nas teclas ou use o teclado do computador.</span>
                <strong>{ativas.length ? ativas.map(nomeMidi).join(" · ") : "Pronto para tocar"}</strong>
            </div>
            <div className="teclado-scroll">
                <div className="teclado" role="group" aria-label={`${instrumento.label} interativo`}>
                    {teclas.map((midi, indice) => {
                        const pitch = ((midi % 12) + 12) % 12;
                        const preta = TECLAS_PRETAS.has(pitch);
                        const atalho = MAPA_TECLADO[indice];
                        const rotulo = ROTULOS_NOTAS[pitch];
                        return (
                            <button
                                key={midi}
                                type="button"
                                className={`tecla ${preta ? "tecla-preta" : "tecla-branca"}${ativas.includes(midi) ? " selecionada" : ""}`}
                                onPointerDown={() => pressionar(midi)}
                                onPointerUp={() => pressionar(midi, true)}
                                onPointerLeave={() => pressionar(midi, true)}
                                aria-label={`Tecla ${nomeMidi(midi)}`}
                                aria-pressed={ativas.includes(midi)}
                            >
                                <span className="tecla-rotulo">
                                    {rotulo.map((nome) => <span key={nome}>{nome}</span>)}
                                </span>
                                {mostrarAtalhos && atalho && <small>{atalho}</small>}
                            </button>
                        );
                    })}
                </div>
            </div>
            <button className="visualizador-limpar" type="button" onClick={limpar} disabled={!ativas.length}>Limpar seleção</button>
        </div>
    );
}

export default function InstrumentoVisualizador({ instrumento, onInteragir }) {
    if (instrumento.type === "keys") return <Teclado instrumento={instrumento} onInteragir={onInteragir} />;
    return null;
}
