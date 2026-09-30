import React, { useState, useRef, useCallback, useEffect } from "react";
import Barra from "../Barra";

/* ------------------------------------------------------------------ *
 *  METRÔNOMO — Web Audio API com scheduler de lookahead.
 *
 *  Por que não um setInterval simples tocando um beep a cada X ms?
 *  O event loop do JS não é preciso (throttle de aba em background,
 *  garbage collection, etc. atrasam o callback), então um metrônomo
 *  em setInterval "arrasta" com o tempo. A técnica padrão (a mesma
 *  usada por libs de áudio sério tipo Tone.js) é: um scheduler barato
 *  roda a cada poucos ms só pra AGENDAR os próximos beats com
 *  AudioContext.currentTime (que é preciso), e o próprio Web Audio
 *  garante o timing exato de quando o som toca.
 * ------------------------------------------------------------------ */

const SCHEDULE_AHEAD_TIME = 0.1; // segundos: o quanto adiantado agendamos
const LOOKAHEAD_MS = 25;         // de quanto em quanto tempo o scheduler roda
const MIN_BPM = 30;
const MAX_BPM = 260;
const COMPASSOS = [2, 3, 4, 6];

export default function Metronomo() {
    const [bpm, setBpm] = useState(120);
    const [compasso, setCompasso] = useState(4);
    const [running, setRunning] = useState(false);
    const [beatAtivo, setBeatAtivo] = useState(-1);

    const audioCtxRef = useRef(null);
    const schedulerRef = useRef(null);
    const nextNoteTimeRef = useRef(0);
    const currentBeatRef = useRef(0);
    const bpmRef = useRef(bpm);
    const compassoRef = useRef(compasso);
    const tapTimesRef = useRef([]);

    useEffect(() => { bpmRef.current = bpm; }, [bpm]);
    useEffect(() => { compassoRef.current = compasso; }, [compasso]);

    const tocarClick = useCallback((time, acentuado) => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = acentuado ? 1500 : 900;
        osc.type = "sine";

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(acentuado ? 0.9 : 0.55, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.08);
    }, []);

    const scheduler = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
            const beat = currentBeatRef.current;
            const acentuado = beat === 0;

            tocarClick(nextNoteTimeRef.current, acentuado);

            const delay = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
            const beatParaExibir = beat;
            setTimeout(() => setBeatAtivo(beatParaExibir), delay);

            const secondsPerBeat = 60.0 / bpmRef.current;
            nextNoteTimeRef.current += secondsPerBeat;
            currentBeatRef.current = (beat + 1) % compassoRef.current;
        }
    }, [tocarClick]);

    const start = useCallback(() => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        currentBeatRef.current = 0;
        nextNoteTimeRef.current = ctx.currentTime + 0.05;

        schedulerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
        setRunning(true);
    }, [scheduler]);

    const stop = useCallback(() => {
        if (schedulerRef.current) {
            clearInterval(schedulerRef.current);
            schedulerRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        setRunning(false);
        setBeatAtivo(-1);
    }, []);

    useEffect(() => stop, [stop]);

    const tapTempo = () => {
        const now = performance.now();
        const taps = tapTimesRef.current.filter((t) => now - t < 2000);
        taps.push(now);
        tapTimesRef.current = taps;

        if (taps.length >= 2) {
            const intervals = [];
            for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
            const media = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const novoBpm = Math.round(60000 / media);
            setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, novoBpm)));
        }
    };

    const ajustar = (delta) => {
        setBpm((v) => Math.min(MAX_BPM, Math.max(MIN_BPM, v + delta)));
    };

    return (
        <div className="pagina">
            <Barra titulo="Metrônomo" />
            <style>{`
                .metro-panel {
                    position: relative;
                    max-width: 720px;
                    width: 100%;
                    margin: 8px auto 0;
                    padding: 40px 34px 34px;
                    text-align: center;
                    border-radius: 22px;
                    background:
                        radial-gradient(circle at 18px 18px, #9db6da 0 5px, transparent 5.5px),
                        radial-gradient(circle at calc(100% - 18px) 18px, #9db6da 0 5px, transparent 5.5px),
                        radial-gradient(circle at 18px calc(100% - 18px), #9db6da 0 5px, transparent 5.5px),
                        radial-gradient(circle at calc(100% - 18px) calc(100% - 18px), #9db6da 0 5px, transparent 5.5px),
                        #e3eefc;
                }

                .metro-ring {
                    width: 220px;
                    height: 220px;
                    margin: 0 auto 22px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #7ea3dd;
                    color: var(--texto);
                }

                .metro-ring.pulse {
                    animation: metroPulse .18s ease-out;
                }

                .metro-ring.pulse.accent {
                    animation-name: metroPulseAccent;
                }

                @keyframes metroPulse {
                    0%   { box-shadow: 0 0 0 0 rgba(47,111,224,.45); }
                    100% { box-shadow: 0 0 0 16px rgba(47,111,224,0); }
                }

                @keyframes metroPulseAccent {
                    0%   { box-shadow: 0 0 0 0 rgba(31,79,143,.6); }
                    100% { box-shadow: 0 0 0 22px rgba(31,79,143,0); }
                }

                .metro-ring-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .metro-bpm {
                    font-size: 64px;
                    font-weight: 700;
                    line-height: 1;
                }

                .metro-bpm-label {
                    font-size: 20px;
                    margin-top: 6px;
                }

                .metro-beats {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    margin-bottom: 30px;
                }

                .metro-beat-dot {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #a4b9da;
                    transition: background .1s ease, transform .1s ease;
                }

                .metro-beat-dot.active {
                    background: var(--primaria);
                    transform: scale(1.2);
                }

                .metro-beat-dot.active.accent {
                    background: var(--primaria-escura);
                }

                .metro-bpm-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 18px;
                    margin-bottom: 24px;
                }

                .metro-bpm-btn {
                    flex: none;
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    background: #cfdcf0;
                    color: var(--texto);
                    font-size: 28px;
                    line-height: 1;
                }

                .metro-bpm-btn:active {
                    transform: scale(.92);
                }

                input[type="range"].metro-slider {
                    flex: 1;
                    -webkit-appearance: none;
                    appearance: none;
                    height: 5px;
                    border-radius: 5px;
                    background: #8ea6cb;
                    outline: none;
                }

                input[type="range"].metro-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: var(--primaria);
                    border: 3px solid #fff;
                    cursor: pointer;
                }

                input[type="range"].metro-slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--primaria);
                    border: 3px solid #fff;
                    cursor: pointer;
                }

                .metro-compasso-row {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 22px;
                }

                .metro-compasso-btn {
                    padding: 8px 16px;
                    border-radius: 999px;
                    background: #d6e4f8;
                    color: var(--primaria-escura);
                    font-size: 15px;
                    font-weight: 600;
                }

                .metro-compasso-btn.active {
                    background: var(--primaria-escura);
                    color: #fff;
                }

                .metro-actions {
                    display: flex;
                    gap: 12px;
                    max-width: 420px;
                    margin: 0 auto;
                }

                .metro-play {
                    flex: 1;
                    padding: 15px;
                    border-radius: 999px;
                    background: var(--primaria-escura);
                    color: #fff;
                    font-size: 16px;
                    font-weight: 700;
                }

                .metro-play.stop {
                    background: var(--vermelho);
                }

                .metro-tap {
                    padding: 15px 26px;
                    border-radius: 999px;
                    background: #cfdcf0;
                    color: var(--primaria-escura);
                    font-size: 16px;
                    font-weight: 700;
                }

                .metro-tap:active {
                    transform: scale(.95);
                }
            `}</style>

            <div className="metro-panel">
                <div className={`metro-ring${beatAtivo >= 0 ? " pulse" : ""}${beatAtivo === 0 ? " accent" : ""}`}
                     key={beatAtivo + "-" + (running ? "on" : "off")}
                >
                    <div className="metro-ring-inner">
                        <div className="metro-bpm">{bpm}</div>
                        <div className="metro-bpm-label">BPM</div>
                    </div>
                </div>

                <div className="metro-beats">
                    {Array.from({ length: compasso }).map((_, i) => (
                        <div
                            key={i}
                            className={`metro-beat-dot${beatAtivo === i ? " active" : ""}${i === 0 ? " accent" : ""}`}
                        />
                    ))}
                </div>

                <div className="metro-bpm-controls">
                    <button className="metro-bpm-btn" onClick={() => ajustar(-1)}>−</button>
                    <input
                        type="range"
                        className="metro-slider"
                        min={MIN_BPM}
                        max={MAX_BPM}
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                    />
                    <button className="metro-bpm-btn" onClick={() => ajustar(1)}>+</button>
                </div>

                <div className="metro-compasso-row">
                    {COMPASSOS.map((c) => (
                        <button
                            key={c}
                            className={`metro-compasso-btn${compasso === c ? " active" : ""}`}
                            onClick={() => setCompasso(c)}
                        >
                            {c}/4
                        </button>
                    ))}
                </div>

                <div className="metro-actions">
                    <button
                        className={`metro-play${running ? " stop" : ""}`}
                        onClick={() => (running ? stop() : start())}
                    >
                        {running ? "Parar" : "Iniciar"}
                    </button>
                    <button className="metro-tap" onClick={tapTempo}>
                        Tap
                    </button>
                </div>
            </div>
        </div>
    );
}