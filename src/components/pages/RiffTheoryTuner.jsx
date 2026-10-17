import React, { useState, useRef, useEffect, useCallback } from "react";
import Barra from "../Barra";
import "./RiffTheoryTuner.css";

/* ------------------------------------------------------------------ *
 *  RIFF THEORY TUNER — versão web (React + Web Audio API)
 *
 *  Portado do protótipo em Python (customtkinter + sounddevice).
 *
 *  Bugs do código original corrigidos nesta versão:
 *
 *  1) Detecção por "pico da FFT" (main.py / pitch_detector.py):
 *     pegava a frequência de maior amplitude no espectro, que em
 *     cordas de instrumento quase sempre é um HARMÔNICO, não a
 *     fundamental (ex.: uma corda grave de baixo em 41 Hz podia
 *     acender como se fosse a oitava acima). Troquei por
 *     AUTOCORRELAÇÃO (ACF2+), o método padrão em afinadores reais,
 *     que segue o período de repetição do sinal no tempo em vez do
 *     pico espectral.
 *
 *  2) O instrumento selecionado (Guitarra/Baixo/Ukulele em notes.py)
 *     nunca era usado de fato: main.py tinha uma lista de notas de
 *     guitarra fixa no código, então trocar o instrumento na tela
 *     não mudava a detecção. Aqui a corda mais próxima é calculada
 *     a partir da afinação do instrumento selecionado.
 *
 *  3) cents_to_text() em utils.py só retornava "Afinado" quando
 *     cents era EXATAMENTE 0.0 — algo que praticamente nunca
 *     acontece com áudio real, então o afinador nunca "acertava".
 *     Aqui uso uma margem de tolerância (±5 cents).
 *
 *  4) A barra de afinação em gui.py era fixa em bar.set(0.5) e nunca
 *     era atualizada com o valor real. Aqui o ponteiro do medidor é
 *     calculado a partir dos cents de desvio a cada leitura.
 *
 *  5) O limiar de volume estava duplicado e inconsistente (0.02 no
 *     main.py vs MIN_VOLUME=0.01 no config.py, nunca usado). Unifiquei
 *     num único limiar de RMS configurável.
 *
 *  6) A janela de FFT curta (2048 amostras) é curta demais para notas
 *     graves de baixo (E1 ≈ 41 Hz precisa de mais de 1000 amostras
 *     por período). Aqui o buffer de análise é maior e a busca por
 *     período é limitada à faixa de frequência plausível de um
 *     instrumento de corda, o que também deixa o cálculo mais leve.
 * ------------------------------------------------------------------ */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const TUNINGS = {
  Guitarra: [
    { name: "E2", freq: 82.41 },
    { name: "A2", freq: 110.0 },
    { name: "D3", freq: 146.83 },
    { name: "G3", freq: 196.0 },
    { name: "B3", freq: 246.94 },
    { name: "E4", freq: 329.63 },
  ],
  Baixo: [
    { name: "E1", freq: 41.2 },
    { name: "A1", freq: 55.0 },
    { name: "D2", freq: 73.42 },
    { name: "G2", freq: 98.0 },
  ],
  Ukulele: [
    { name: "G4", freq: 392.0 },
    { name: "C4", freq: 261.63 },
    { name: "E4", freq: 329.63 },
    { name: "A4", freq: 440.0 },
  ],
};

const TUNING_PRESETS = {
  Guitarra: [
    { id: "standard", name: "Padrão E", summary: "E2 · A2 · D3 · G3 · B3 · E4", strings: TUNINGS.Guitarra },
    { id: "drop-d", name: "Drop D", summary: "D2 · A2 · D3 · G3 · B3 · E4", strings: [
      { name: "D2", freq: 73.42 }, { name: "A2", freq: 110.0 }, { name: "D3", freq: 146.83 },
      { name: "G3", freq: 196.0 }, { name: "B3", freq: 246.94 }, { name: "E4", freq: 329.63 },
    ] },
    { id: "eb", name: "Meio tom abaixo", summary: "D#2 · G#2 · C#3 · F#3 · A#3 · D#4", strings: [
      { name: "D#2", freq: 77.78 }, { name: "G#2", freq: 103.83 }, { name: "C#3", freq: 138.59 },
      { name: "F#3", freq: 185.00 }, { name: "A#3", freq: 233.08 }, { name: "D#4", freq: 311.13 },
    ] },
    { id: "dadgad", name: "DADGAD", summary: "D2 · A2 · D3 · G3 · A3 · D4", strings: [
      { name: "D2", freq: 73.42 }, { name: "A2", freq: 110.0 }, { name: "D3", freq: 146.83 },
      { name: "G3", freq: 196.0 }, { name: "A3", freq: 220.0 }, { name: "D4", freq: 293.66 },
    ] },
    { id: "open-g", name: "Open G", summary: "D2 · G2 · D3 · G3 · B3 · D4", strings: [
      { name: "D2", freq: 73.42 }, { name: "G2", freq: 98.00 }, { name: "D3", freq: 146.83 },
      { name: "G3", freq: 196.0 }, { name: "B3", freq: 246.94 }, { name: "D4", freq: 293.66 },
    ] },
    { id: "d-standard", name: "D Standard", summary: "D2 · G2 · C3 · F3 · A3 · D4", strings: [
      { name: "D2", freq: 73.42 }, { name: "G2", freq: 98.00 }, { name: "C3", freq: 130.81 },
      { name: "F3", freq: 174.61 }, { name: "A3", freq: 220.0 }, { name: "D4", freq: 293.66 },
    ] },
    { id: "drop-c", name: "Drop C", summary: "C2 · G2 · C3 · F3 · A3 · D4", strings: [
      { name: "C2", freq: 65.41 }, { name: "G2", freq: 98.00 }, { name: "C3", freq: 130.81 },
      { name: "F3", freq: 174.61 }, { name: "A3", freq: 220.0 }, { name: "D4", freq: 293.66 },
    ] },
    { id: "open-d", name: "Open D", summary: "D2 · A2 · D3 · F#3 · A3 · D4", strings: [
      { name: "D2", freq: 73.42 }, { name: "A2", freq: 110.0 }, { name: "D3", freq: 146.83 },
      { name: "F#3", freq: 185.0 }, { name: "A3", freq: 220.0 }, { name: "D4", freq: 293.66 },
    ] },
    { id: "open-c", name: "Open C", summary: "C2 · G2 · C3 · G3 · C4 · E4", strings: [
      { name: "C2", freq: 65.41 }, { name: "G2", freq: 98.00 }, { name: "C3", freq: 130.81 },
      { name: "G3", freq: 196.0 }, { name: "C4", freq: 261.63 }, { name: "E4", freq: 329.63 },
    ] },
    { id: "open-e", name: "Open E", summary: "E2 · B2 · E3 · G#3 · B3 · E4", strings: [
      { name: "E2", freq: 82.41 }, { name: "B2", freq: 123.47 }, { name: "E3", freq: 164.81 },
      { name: "G#3", freq: 207.65 }, { name: "B3", freq: 246.94 }, { name: "E4", freq: 329.63 },
    ] },
    { id: "open-a", name: "Open A", summary: "E2 · A2 · E3 · A3 · C#4 · E4", strings: [
      { name: "E2", freq: 82.41 }, { name: "A2", freq: 110.0 }, { name: "E3", freq: 164.81 },
      { name: "A3", freq: 220.0 }, { name: "C#4", freq: 277.18 }, { name: "E4", freq: 329.63 },
    ] },
  ],
  Baixo: [
    { id: "standard", name: "Padrão E", summary: "E1 · A1 · D2 · G2", strings: TUNINGS.Baixo },
    { id: "drop-d", name: "Drop D", summary: "D1 · A1 · D2 · G2", strings: [
      { name: "D1", freq: 36.71 }, { name: "A1", freq: 55.0 }, { name: "D2", freq: 73.42 }, { name: "G2", freq: 98.0 },
    ] },
    { id: "five-string", name: "5 cordas · Si", summary: "B0 · E1 · A1 · D2 · G2", strings: [
      { name: "B0", freq: 30.87 }, { name: "E1", freq: 41.2 }, { name: "A1", freq: 55.0 },
      { name: "D2", freq: 73.42 }, { name: "G2", freq: 98.0 },
    ] },
    { id: "drop-c", name: "Drop C", summary: "C1 · G1 · C2 · F2", strings: [
      { name: "C1", freq: 32.70 }, { name: "G1", freq: 49.0 }, { name: "C2", freq: 65.41 }, { name: "F2", freq: 87.31 },
    ] },
    { id: "c-standard", name: "C Standard", summary: "C1 · F1 · A#1 · D#2", strings: [
      { name: "C1", freq: 32.70 }, { name: "F1", freq: 43.65 }, { name: "A#1", freq: 58.27 }, { name: "D#2", freq: 77.78 },
    ] },
    { id: "d-standard", name: "D Standard", summary: "D1 · G1 · C2 · F2", strings: [
      { name: "D1", freq: 36.71 }, { name: "G1", freq: 49.0 }, { name: "C2", freq: 65.41 }, { name: "F2", freq: 87.31 },
    ] },
  ],
  Ukulele: [
    { id: "standard", name: "GCEA · G agudo", summary: "G4 · C4 · E4 · A4", strings: TUNINGS.Ukulele },
    { id: "low-g", name: "GCEA · G grave", summary: "G3 · C4 · E4 · A4", strings: [
      { name: "G3", freq: 196.0 }, { name: "C4", freq: 261.63 }, { name: "E4", freq: 329.63 }, { name: "A4", freq: 440.0 },
    ] },
    { id: "d-tuning", name: "Afinação D", summary: "A4 · D4 · F#4 · B4", strings: [
      { name: "A4", freq: 440.0 }, { name: "D4", freq: 293.66 }, { name: "F#4", freq: 369.99 }, { name: "B4", freq: 493.88 },
    ] },
    { id: "baritone", name: "Barítono · DGBE", summary: "D3 · G3 · B3 · E4", strings: [
      { name: "D3", freq: 146.83 }, { name: "G3", freq: 196.0 }, { name: "B3", freq: 246.94 }, { name: "E4", freq: 329.63 },
    ] },
  ],
};

const INSTRUMENTS = Object.keys(TUNINGS);
const REFERENCE_OPTIONS = [415, 432, 440, 442];
const IN_TUNE_CENTS = 5;
const CLOSE_CENTS = 15;
const MIN_FREQ = 27;
const MAX_FREQ = 1200;

function freqToNote(frequency, a4) {
  const midi = 69 + 12 * Math.log2(frequency / a4);
  const nearest = Math.round(midi);
  const exactFreq = a4 * Math.pow(2, (nearest - 69) / 12);
  const cents = 1200 * Math.log2(frequency / exactFreq);
  const noteName = NOTE_NAMES[((nearest % 12) + 12) % 12];
  const octave = Math.floor(nearest / 12) - 1;
  return { note: noteName, octave, cents, midi: nearest };
}

function nearestString(frequency, tuning) {
  let best = null;
  let bestDiffCents = Infinity;
  for (const s of tuning) {
    const diffCents = 1200 * Math.log2(frequency / s.freq);
    if (Math.abs(diffCents) < Math.abs(bestDiffCents)) {
      bestDiffCents = diffCents;
      best = s;
    }
  }
  return { string: best, cents: bestDiffCents };
}

// Autocorrelação normalizada — detecta o período fundamental no domínio do
// tempo sem favorecer janelas curtas ou amplitudes diferentes do microfone.
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;

  let mean = 0;
  for (let i = 0; i < SIZE; i++) mean += buffer[i];
  mean /= SIZE;

  let energy = 0;
  for (let i = 0; i < SIZE; i++) {
    const centered = buffer[i] - mean;
    energy += centered * centered;
  }
  const rms = Math.sqrt(energy / SIZE);
  if (rms < 0.004) return -1; // silêncio / ruído de fundo

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(SIZE - 2, Math.floor(sampleRate / MIN_FREQ));
  const correlation = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let energyA = 0;
    let energyB = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      const a = buffer[i] - mean;
      const b = buffer[i + lag] - mean;
      sum += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    correlation[lag] = energyA && energyB ? sum / Math.sqrt(energyA * energyB) : 0;
  }

  let globalPeak = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (correlation[lag] > globalPeak) globalPeak = correlation[lag];
  }
  if (globalPeak < 0.32) return -1;

  // Prefere o primeiro pico forte: isso reduz erros de oitava causados por
  // harmônicos dominantes em captadores e microfones de notebook.
  const peakThreshold = globalPeak * 0.84;
  let maxPos = -1;
  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    if (
      correlation[lag] >= peakThreshold &&
      correlation[lag] >= correlation[lag - 1] &&
      correlation[lag] >= correlation[lag + 1]
    ) {
      maxPos = lag;
      break;
    }
  }
  if (maxPos < 0) return -1;

  // Interpolação parabólica para refinar o período estimado
  const x1 = correlation[maxPos - 1];
  const x2 = correlation[maxPos];
  const x3 = correlation[maxPos + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  let T0 = maxPos;
  if (a !== 0) T0 = maxPos - b / (2 * a);

  return sampleRate / T0;
}

export default function RiffTheoryTuner() {
  const [running, setRunning] = useState(false);
  const [instrument, setInstrument] = useState("Guitarra");
  const [tuningPreset, setTuningPreset] = useState("standard");
  const [referenceA4, setReferenceA4] = useState(440);
  const [reading, setReading] = useState(null);
  const [error, setError] = useState(null);
  const [cordaAPorda, setCordaAPorda] = useState(false);
  const [targetStringIndex, setTargetStringIndex] = useState(0);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const bufferRef = useRef(null);
  const intervalRef = useRef(null);
  const tickRef = useRef(null);
  const historyRef = useRef([]);
  const missedFramesRef = useRef(0);
  const selectedTuning = TUNING_PRESETS[instrument].find((preset) => preset.id === tuningPreset) || TUNING_PRESETS[instrument][0];
  const targetString = selectedTuning.strings[targetStringIndex] || selectedTuning.strings[0];

  function chooseInstrument(nextInstrument) {
    historyRef.current = [];
    missedFramesRef.current = 0;
    setReading(null);
    setInstrument(nextInstrument);
    setTuningPreset(TUNING_PRESETS[nextInstrument][0].id);
    setTargetStringIndex(0);
  }

  function chooseTuning(presetId) {
    historyRef.current = [];
    missedFramesRef.current = 0;
    setReading(null);
    setTuningPreset(presetId);
    setTargetStringIndex(0);
  }

  function toggleCordaAPorda() {
    historyRef.current = [];
    missedFramesRef.current = 0;
    setReading(null);
    setCordaAPorda((active) => !active);
  }

  function chooseTargetString(index) {
    historyRef.current = [];
    missedFramesRef.current = 0;
    setReading(null);
    setTargetStringIndex(index);
  }

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    historyRef.current = [];
    missedFramesRef.current = 0;
    setRunning(false);
    setReading(null);
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    const buf = bufferRef.current;
    if (!analyser || !audioCtx || !buf) return;

    analyser.getFloatTimeDomainData(buf);
    const freq = autoCorrelate(buf, audioCtx.sampleRate);

    if (freq === -1 || freq < MIN_FREQ || freq > MAX_FREQ) {
      missedFramesRef.current += 1;
      if (missedFramesRef.current >= 6) {
        historyRef.current = [];
        setReading((prev) => (prev ? { ...prev, active: false } : prev));
      }
      return;
    }

    missedFramesRef.current = 0;
    // Mediana curta para suavizar sem misturar uma leitura espúria de oitava.
    const hist = historyRef.current;
    hist.push(freq);
    if (hist.length > 5) hist.shift();
    const ordenadas = [...hist].sort((a, b) => a - b);
    const smoothed = ordenadas[Math.floor(ordenadas.length / 2)];

    const { note, octave, cents } = freqToNote(smoothed, referenceA4);
    const { string, cents: stringCents } = nearestString(smoothed, selectedTuning.strings);
    const targetCents = 1200 * Math.log2(smoothed / targetString.freq);

    setReading({
      active: true,
      frequency: smoothed,
      note,
      octave,
      cents,
      stringName: string ? string.name : null,
      stringCents,
      targetCents,
      targetMatch: string ? string.name === targetString.name : false,
    });
  }, [cordaAPorda, instrument, referenceA4, selectedTuning, targetString]);

  tickRef.current = tick;

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          latency: { ideal: 0.01 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      historyRef.current = [];
      missedFramesRef.current = 0;
      setRunning(true);
      intervalRef.current = setInterval(() => tickRef.current?.(), 80);
    } catch (err) {
      setError(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador e tente novamente."
      );
      stop();
    }
  }, [tick, stop]);

  useEffect(() => stop, [stop]);

  // status: 'flat' | 'sharp' | 'tune' | 'close'
  const cents = reading && reading.active ? (cordaAPorda ? reading.targetCents : reading.cents) : 0;
  const inTune = reading && reading.active && Math.abs(cents) <= IN_TUNE_CENTS;
  const close = reading && reading.active && Math.abs(cents) <= CLOSE_CENTS;

  let statusText = "AGUARDANDO SINAL";
  let statusColor = "var(--muted)";
  if (reading && reading.active) {
    if (cordaAPorda && !reading.targetMatch) {
      statusText = `TOQUE A CORDA ${targetString.name}`;
      statusColor = "var(--amber)";
    } else if (inTune) {
      statusText = "AFINADO";
      statusColor = "var(--green)";
    } else if (cents < 0) {
      statusText = "MUITO BAIXO";
      statusColor = close ? "var(--amber)" : "var(--red)";
    } else {
      statusText = "MUITO ALTO";
      statusColor = close ? "var(--amber)" : "var(--red)";
    }
  }

  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needleAngle = (clampedCents / 50) * 45; // -45deg .. +45deg

  return (
    <div className="pagina">
      <Barra titulo="Afinador" />
      <div className="rt-root">

<div className={`rt-panel${inTune ? " in-tune" : ""}`}>
        <header className="rt-panel-head">
          <div className="rt-panel-intro">
            <span className="rt-kicker">AFINAÇÃO CROMÁTICA</span>
            <h2>Ajuste seu instrumento</h2>
            <p>Toque uma corda por vez e acompanhe a afinação em tempo real.</p>
          </div>
          <label className="rt-ref-select" htmlFor="rt-reference">
            <span>Tom de referência</span>
            <select
              id="rt-reference"
              value={referenceA4}
              onChange={(e) => setReferenceA4(Number(e.target.value))}
            >
              {REFERENCE_OPTIONS.map((f) => (
                <option key={f} value={f}>{f} Hz</option>
              ))}
            </select>
          </label>
        </header>

        <div className="rt-instruments-wrap">
          <span className="rt-label">Instrumento</span>
          <div className="rt-instruments">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                className={"rt-instrument-btn" + (instrument === inst ? " active" : "")}
                aria-pressed={instrument === inst}
                onClick={() => chooseInstrument(inst)}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        <section className="rt-tuning-section" aria-label="Afinações disponíveis">
          <div className="rt-tuning-heading">
            <div>
              <span className="rt-label">Afinação das cordas</span>
              <p>Selecione um preset para atualizar as notas-alvo.</p>
            </div>
            <span className="rt-selected-tuning">{selectedTuning.name}</span>
          </div>
          <div className="rt-tuning-options" role="group" aria-label={`Presets de afinação para ${instrument}`}>
            {TUNING_PRESETS[instrument].map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={"rt-tuning-option" + (selectedTuning.id === preset.id ? " active" : "")}
                aria-pressed={selectedTuning.id === preset.id}
                onClick={() => chooseTuning(preset.id)}
              >
                <strong>{preset.name}</strong>
                <span>{preset.summary}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="rt-main-grid">
          <section className="rt-readout" aria-label="Leitura do afinador">
            <div className="rt-gauge-wrap">
              <VUGauge angle={reading && reading.active ? needleAngle : 0} inTune={!!inTune} color={statusColor} />
            </div>
            <div className="rt-note-display">
              <span className={`rt-note rt-tone-${reading && reading.active ? (inTune ? "green" : close ? "amber" : "red") : "idle"}`}>
                {reading && reading.active ? reading.note : "--"}
              </span>
              {reading && reading.active && (
                <span className="rt-octave">{reading.octave}</span>
              )}
              <div className="rt-freq">
                {reading && reading.active ? `${reading.frequency.toFixed(2)} Hz` : "-- Hz"}
                {reading && reading.active && (
                  <span> &nbsp;·&nbsp; {cents >= 0 ? "+" : ""}{cents.toFixed(1)} cents</span>
                )}
              </div>
            </div>
            <div className={`rt-status rt-tone-${reading && reading.active ? (inTune ? "green" : close ? "amber" : "red") : "idle"}`}>
              {running ? statusText : "PRONTO PARA AFINAR"}
            </div>
          </section>

          <aside className="rt-controls">
            <div className="rt-control-group">
              <div className="rt-control-heading">
                <div>
                  <span className="rt-label">Notas da afinação</span>
                  {cordaAPorda && <small className="rt-mode-caption">Alvo: {targetString.name}</small>}
                </div>
                <div className="rt-control-heading-actions">
                  <span>{instrument}</span>
                  <button
                    type="button"
                    className={`rt-mode-toggle${cordaAPorda ? " active" : ""}`}
                    aria-pressed={cordaAPorda}
                    onClick={toggleCordaAPorda}
                  >
                    Corda a corda
                  </button>
                </div>
              </div>
              <div className="rt-string-row">
                {selectedTuning.strings.map((s, index) => {
                  const selected = reading && reading.active && reading.stringName === s.name;
                  const target = cordaAPorda && targetString.name === s.name;
                  const tuned = selected && Math.abs(cordaAPorda ? reading.targetCents : reading.stringCents) <= IN_TUNE_CENTS;
                  if (cordaAPorda) {
                    return (
                      <button
                        key={s.name}
                        type="button"
                        className={`rt-string-chip${target ? " target" : ""}${selected ? " active" : ""}${tuned && target ? " in-tune" : ""}`}
                        aria-pressed={target}
                        onClick={() => chooseTargetString(index)}
                      >
                        {s.name}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={s.name}
                      className={"rt-string-chip" + (selected ? " active" : "") + (tuned ? " in-tune" : "")}
                    >
                      {s.name}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rt-target">
              <span>{cordaAPorda ? "Corda alvo" : "Corda mais próxima"}</span>
              <strong>{cordaAPorda ? targetString.name : (reading && reading.active ? reading.stringName : "—")}</strong>
              <span>
                {reading && reading.active
                  ? `${cents >= 0 ? "+" : ""}${cents.toFixed(1)} cents`
                  : "Aguardando sinal"}
              </span>
            </div>

            <p className="rt-hint">
              {cordaAPorda ? `Selecione ${targetString.name} e toque somente essa corda.` : "Toque uma corda por vez, o mais próximo do microfone possível."}
            </p>
          </aside>
        </div>

        <footer className="rt-footer">
          <button
            type="button"
            className={"rt-footswitch" + (running ? " on" : "")}
            onClick={() => (running ? stop() : start())}
          >
            {running ? "Parar afinador" : "Iniciar afinador"}
          </button>
          <p className="rt-footer-note">
            {running ? "Microfone ativo · ajuste uma corda de cada vez." : "Permita o acesso ao microfone para começar."}
          </p>
          {error && <div className="rt-error" role="alert">{error}</div>}
        </footer>
      </div>
      </div>
    </div>
  );
}

function VUGauge({ angle, inTune, color }) {
  // Arco semicircular com marcações de -50 a +50 cents e ponteiro estilo VU meter.
  const cx = 200;
  const cy = 165;
  const r = 130;

  const ticks = [-50, -25, 0, 25, 50];

  const toXY = (deg, radius) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  return (
    <svg viewBox="0 0 400 195" width="100%" height="100%">
      {/* Arco de fundo */}
      <path
        d={`M ${toXY(-45, r).x} ${toXY(-45, r).y} A ${r} ${r} 0 0 1 ${toXY(45, r).x} ${toXY(45, r).y}`}
        stroke="#e2e7ec"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${toXY(-45, r).x} ${toXY(-45, r).y} A ${r} ${r} 0 0 1 ${toXY(45, r).x} ${toXY(45, r).y}`}
        stroke="#b8c6d8"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Marcações */}
      {ticks.map((t) => {
        const deg = (t / 50) * 45;
        const outer = toXY(deg, r + 10);
        const inner = toXY(deg, r - 6);
        return (
          <g key={t}>
            <line
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={t === 0 ? "#315ce8" : "#8a97a8"}
              strokeWidth={t === 0 ? 3 : 1.5}
            />
            <text
              x={toXY(deg, r + 24).x}
              y={toXY(deg, r + 24).y}
              fill="#68778b"
              fontSize="10"
              fontFamily="'IBM Plex Mono', monospace"
              textAnchor="middle"
            >
              {t > 0 ? `+${t}` : t}
            </text>
          </g>
        );
      })}

      {/* Ponteiro */}
      <g className="rt-gauge-needle" transform={`rotate(${angle} ${cx} ${cy})`}>
        <line
          x1={cx} y1={cy} x2={cx} y2={cy - r + 14}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <circle cx={cx} cy={cy} r="7" fill={color} stroke="#fff" strokeWidth="2" />
      {inTune && <circle cx={cx} cy={cy} r="14" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />}
    </svg>
  );
}
