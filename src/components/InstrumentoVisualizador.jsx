import { useEffect, useMemo, useRef, useState } from "react";
import NOTAS from "../assets/constants/NOTAS.json";

const TECLAS_PRETAS = new Set([1, 3, 6, 8, 10]);
const MAPA_TECLADO = "awsedftgyhujkolp;";
const NOTAS_SAX = [
    ["B3", 59], ["C4", 60], ["D4", 62], ["E4", 64], ["F4", 65], ["G4", 67],
    ["A4", 69], ["B4", 71], ["C5", 72], ["D5", 74], ["E5", 76], ["F5", 77],
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
    const [mostrarAtalhos, setMostrarAtalhos] = useState(true);
    const [sustain, setSustain] = useState(false);
    const teclas = useMemo(() => Array.from({ length: instrumento.keyCount }, (_, i) => instrumento.startMidi + oitava * 12 + i), [instrumento, oitava]);
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
                    <button type="button" className="controle-mini" onClick={() => setOitava((valor) => Math.max(-2, valor - 1))}>−</button>
                    <span className="controle-status">Oitava {oitava >= 0 ? "+" : ""}{oitava}</span>
                    <button type="button" className="controle-mini" onClick={() => setOitava((valor) => Math.min(2, valor + 1))}>+</button>
                </div>
                <button type="button" className={`controle-toggle${sustain ? " ativo" : ""}`} onClick={() => setSustain((valor) => !valor)} aria-pressed={sustain}>Sustain {sustain ? "ligado" : "desligado"}</button>
                <button type="button" className={`controle-toggle${mostrarAtalhos ? " ativo" : ""}`} onClick={() => setMostrarAtalhos((valor) => !valor)} aria-pressed={mostrarAtalhos}>Atalhos</button>
            </div>
            <div className="visualizador-legenda">
                <span>Toque, use o teclado do computador ou combine várias teclas.</span>
                <strong>{ativas.length ? ativas.map(nomeMidi).join(" · ") : "Pronto para tocar"}</strong>
            </div>
            <div className="teclado" role="group" aria-label={`${instrumento.label} interativo`}>
                {teclas.map((midi, indice) => {
                    const preta = TECLAS_PRETAS.has(midi % 12);
                    const atalho = MAPA_TECLADO[indice];
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
                            {!preta && <span>{nomeMidi(midi)}</span>}
                            {mostrarAtalhos && <small>{atalho}</small>}
                        </button>
                    );
                })}
            </div>
            <button className="visualizador-limpar" type="button" onClick={limpar} disabled={!ativas.length}>Limpar seleção</button>
        </div>
    );
}

const DIGITACOES_SAX = {
    B3: [1, 2, 3, 4, 5, 6, "oitava"], C4: [1, 2, 3, 4, 5, 6], D4: [1, 2, 3, 4, 5],
    E4: [1, 2, 3, 4], F4: [1, 2, 3], G4: [1, 2], A4: [1], B4: [],
    C5: ["oitava"], D5: ["oitava", "alt-1"], E5: ["oitava", "alt-1", "alt-2"], F5: ["oitava", "alt-1", "alt-2", "alt-3"],
};

function Saxofone({ onInteragir }) {
    const [nota, setNota] = useState("B3");
    const [tipo, setTipo] = useState("Alto");
    const teclasAtivas = DIGITACOES_SAX[nota] || [];
    const indiceNota = NOTAS_SAX.findIndex(([nome]) => nome === nota);

    function escolher(nome) {
        setNota(nome);
        const midi = NOTAS_SAX.find(([item]) => item === nome)?.[1];
        if (midi) tocarNota(midi, 1.1, "sawtooth");
        onInteragir?.();
    }

    return (
        <div className="instrumento-visualizador sax-visualizador">
            <div className="instrumento-toolbar">
                <div className="instrumento-toolbar-grupo sax-tipos" role="group" aria-label="Tipo de saxofone">
                    {["Soprano", "Alto", "Tenor"].map((item) => <button key={item} type="button" className={`controle-toggle${tipo === item ? " ativo" : ""}`} onClick={() => setTipo(item)}>{item}</button>)}
                </div>
                <span className="controle-status">Digitação escrita · {tipo}</span>
            </div>
            <div className="visualizador-legenda">
                <span>Escolha uma nota para iluminar as chaves correspondentes.</span>
                <strong>{nota} · {indiceNota >= 0 ? NOTAS_SAX[indiceNota][0] : ""}</strong>
            </div>
            <div className="sax-corpo" aria-label={`Digitação do saxofone ${tipo}`}>
                <div className="sax-bocal" aria-hidden="true">Bocal</div>
                <div className="sax-maos">
                    <span className="sax-mao-label">Mão esquerda</span>
                    <div className="sax-furos">
                        {[1, 2, 3, 4, 5, 6].map((chave) => <span key={chave} className={`sax-furo-grafico${teclasAtivas.includes(chave) ? " pressionado" : ""}`}>{chave}</span>)}
                    </div>
                    <span className="sax-mao-label">Mão direita</span>
                </div>
                <div className="sax-campana" aria-hidden="true">Campana</div>
            </div>
            <div className="sax-notas" role="list" aria-label="Notas do saxofone">
                {NOTAS_SAX.map(([nome]) => <button key={nome} type="button" className={nota === nome ? "selecionada" : ""} onClick={() => escolher(nome)}>{nome}</button>)}
            </div>
            <p className="visualizador-nota">As digitações são uma referência inicial de estudo. Há posições alternativas e diferenças de afinação entre modelos.</p>
        </div>
    );
}

export default function InstrumentoVisualizador({ instrumento, onInteragir }) {
    if (instrumento.type === "keys") return <Teclado instrumento={instrumento} onInteragir={onInteragir} />;
    if (instrumento.type === "wind") return <Saxofone onInteragir={onInteragir} />;
    return null;
}
