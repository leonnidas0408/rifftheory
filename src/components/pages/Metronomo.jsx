import React, { useCallback, useEffect, useRef, useState } from "react";
import Barra from "../Barra";
import "./Metronomo.css";

/* ------------------------------------------------------------------ *
 *  METRÔNOMO — Web Audio API com scheduler de lookahead.
 *
 *  O scheduler agenda os próximos pulsos com AudioContext.currentTime,
 *  evitando a deriva de tempo de um setInterval simples.
 * ------------------------------------------------------------------ */

const SCHEDULE_AHEAD_TIME = 0.1;
const LOOKAHEAD_MS = 25;
const MIN_BPM = 20;
const MAX_BPM = 400;
const COMPASSOS = [1, 2, 3, 4, 6];

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
            <div className="metro-root">
<section className="metro-panel" aria-labelledby="metro-title">
                    <header className="metro-panel-head">
                        <div className="metro-panel-intro">
                            <span className="metro-kicker">RITMO E ANDAMENTO</span>
                            <h2 id="metro-title">Ajuste o pulso da sua prática</h2>
                            <p>Defina o BPM, escolha o compasso e acompanhe cada batida.</p>
                        </div>
                        <div className="metro-range-note" aria-label="Faixa de andamento">
                            <span>Faixa de andamento</span>
                            <strong>{MIN_BPM}–{MAX_BPM} BPM</strong>
                        </div>
                    </header>

                    <div className="metro-main-grid">
                        <section className="metro-readout" aria-label="Visualização do andamento">
                            <div
                                className={`metro-ring${beatAtivo >= 0 ? " pulse" : ""}${beatAtivo === 0 ? " accent" : ""}`}
                                key={`${beatAtivo}-${running ? "on" : "off"}`}
                                aria-label={`${bpm} batidas por minuto`}
                            >
                                <div className="metro-ring-inner">
                                    <div className="metro-bpm">{bpm}</div>
                                    <div className="metro-bpm-label">BATIDAS POR MINUTO</div>
                                </div>
                            </div>

                            <div className="metro-beats" aria-label={`Compasso ${compasso}/4`}>
                                {Array.from({ length: compasso }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`metro-beat-dot${beatAtivo === i ? " active" : ""}${i === 0 ? " accent" : ""}`}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <div className={`metro-status${running ? " active" : ""}${running && beatAtivo === 0 ? " accent" : ""}`}>
                                {!running
                                    ? "PRONTO PARA TOCAR"
                                    : beatAtivo < 0
                                        ? "METRÔNOMO ATIVO"
                                        : beatAtivo === 0
                                            ? "TEMPO FORTE"
                                            : `BATIDA ${beatAtivo + 1}`}
                            </div>
                        </section>

                        <aside className="metro-controls" aria-label="Controles do metrônomo">
                            <section className="metro-control-group" aria-labelledby="metro-bpm-label">
                                <div className="metro-control-heading">
                                    <label className="metro-label" id="metro-bpm-label" htmlFor="metro-bpm">Andamento</label>
                                    <span className="metro-control-value">{bpm} BPM</span>
                                </div>
                                <div className="metro-slider-row">
                                    <button type="button" className="metro-adjust-btn" onClick={() => ajustar(-1)} aria-label="Diminuir um BPM">−</button>
                                    <input
                                        id="metro-bpm"
                                        type="range"
                                        className="metro-slider"
                                        min={MIN_BPM}
                                        max={MAX_BPM}
                                        value={bpm}
                                        aria-valuetext={`${bpm} BPM`}
                                        onChange={(e) => setBpm(Number(e.target.value))}
                                    />
                                    <button type="button" className="metro-adjust-btn" onClick={() => ajustar(1)} aria-label="Aumentar um BPM">+</button>
                                </div>
                                <div className="metro-range-labels" aria-hidden="true">
                                    <span>{MIN_BPM}</span>
                                    <span>{MAX_BPM}</span>
                                </div>
                            </section>

                            <section className="metro-control-group" aria-labelledby="metro-compasso-label">
                                <div className="metro-control-heading">
                                    <span className="metro-label" id="metro-compasso-label">Compasso</span>
                                    <span className="metro-control-value">{compasso} batidas</span>
                                </div>
                                <div className="metro-compasso-row" role="group" aria-label="Selecione o compasso">
                                    {COMPASSOS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`metro-compasso-btn${compasso === c ? " active" : ""}`}
                                            aria-pressed={compasso === c}
                                            onClick={() => setCompasso(c)}
                                        >
                                            {c}/4
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <p className="metro-hint">Use “Tap tempo” para medir um ritmo tocando no pulso da música.</p>
                        </aside>
                    </div>

                    <footer className="metro-footer">
                        <div className="metro-actions">
                            <button
                                type="button"
                                className={`metro-play${running ? " stop" : ""}`}
                                onClick={() => (running ? stop() : start())}
                            >
                                {running ? "Parar metrônomo" : "Iniciar metrônomo"}
                            </button>
                            <button type="button" className="metro-tap" onClick={tapTempo}>
                                Tap tempo
                            </button>
                        </div>
                        <p className="metro-footer-note">
                            {running
                                ? "Metrônomo ativo · o primeiro pulso de cada compasso é acentuado."
                                : "Clique em iniciar para ouvir o pulso no andamento escolhido."}
                        </p>
                    </footer>
                </section>
            </div>
        </div>
    );
}
