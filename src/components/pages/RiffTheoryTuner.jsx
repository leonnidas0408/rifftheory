import React, { useState, useRef, useEffect, useCallback } from "react";
import Barra from "../Barra";

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
  ],
  Ukulele: [
    { id: "standard", name: "GCEA · G agudo", summary: "G4 · C4 · E4 · A4", strings: TUNINGS.Ukulele },
    { id: "low-g", name: "GCEA · G grave", summary: "G3 · C4 · E4 · A4", strings: [
      { name: "G3", freq: 196.0 }, { name: "C4", freq: 261.63 }, { name: "E4", freq: 329.63 }, { name: "A4", freq: 440.0 },
    ] },
    { id: "d-tuning", name: "Afinação D", summary: "A4 · D4 · F#4 · B4", strings: [
      { name: "A4", freq: 440.0 }, { name: "D4", freq: 293.66 }, { name: "F#4", freq: 369.99 }, { name: "B4", freq: 493.88 },
    ] },
  ],
};

const INSTRUMENTS = Object.keys(TUNINGS);
const REFERENCE_OPTIONS = [415, 432, 440, 442];
const IN_TUNE_CENTS = 5;
const CLOSE_CENTS = 15;
const MIN_FREQ = 30;
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

// Autocorrelação (ACF2+) — detecta o período fundamental do sinal no
// domínio do tempo, robusto a harmônicos fortes (o problema do FFT puro).
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;

  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // silêncio / ruído de fundo

  // Corta silêncio nas bordas
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }
  const trimmed = buffer.slice(r1, r2);
  const n = trimmed.length;
  if (n < 8) return -1;

  const maxLag = Math.min(n - 1, Math.floor(sampleRate / MIN_FREQ));
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQ));

  const c = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += trimmed[i] * trimmed[i + lag];
    c[lag] = sum;
  }

  let d = minLag;
  while (d < maxLag && c[d] > c[d + 1]) d++;

  let maxVal = -Infinity;
  let maxPos = -1;
  for (let i = d; i <= maxLag; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  if (maxPos <= minLag || maxPos >= maxLag) return -1;

  // Interpolação parabólica para refinar o período estimado
  const x1 = c[maxPos - 1];
  const x2 = c[maxPos];
  const x3 = c[maxPos + 1];
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

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const bufferRef = useRef(null);
  const intervalRef = useRef(null);
  const tickRef = useRef(null);
  const historyRef = useRef([]);
  const selectedTuning = TUNING_PRESETS[instrument].find((preset) => preset.id === tuningPreset) || TUNING_PRESETS[instrument][0];

  function chooseInstrument(nextInstrument) {
    historyRef.current = [];
    setReading(null);
    setInstrument(nextInstrument);
    setTuningPreset(TUNING_PRESETS[nextInstrument][0].id);
  }

  function chooseTuning(presetId) {
    historyRef.current = [];
    setReading(null);
    setTuningPreset(presetId);
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
      historyRef.current = [];
      setReading((prev) => (prev ? { ...prev, active: false } : prev));
      return;
    }

    // Média móvel curta para suavizar leituras sem misturar oitavas erradas
    const hist = historyRef.current;
    hist.push(freq);
    if (hist.length > 4) hist.shift();
    const smoothed = hist.reduce((a, b) => a + b, 0) / hist.length;

    const { note, octave, cents } = freqToNote(smoothed, referenceA4);
    const { string, cents: stringCents } = nearestString(smoothed, selectedTuning.strings);

    setReading({
      active: true,
      frequency: smoothed,
      note,
      octave,
      cents,
      stringName: string ? string.name : null,
      stringCents,
    });
  }, [instrument, referenceA4, selectedTuning]);

  tickRef.current = tick;

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      historyRef.current = [];
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
  const cents = reading && reading.active ? reading.cents : 0;
  const inTune = reading && reading.active && Math.abs(cents) <= IN_TUNE_CENTS;
  const close = reading && reading.active && Math.abs(cents) <= CLOSE_CENTS;

  let statusText = "AGUARDANDO SINAL";
  let statusColor = "var(--muted)";
  if (reading && reading.active) {
    if (inTune) {
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
      <style>{`
        .rt-root {
          --green: #8ff0b6;
          --amber: #ffd166;
          --red: #ff9a8c;
          --cream: #ffffff;
          --muted: #cfe0f7;

          width: 100%;
        }

        .rt-panel {
          position: relative;
          width: 100%;
          max-width: 760px;
          margin: 8px auto 0;
          padding: 34px 40px 30px;
          border-radius: 22px;
          color: #fff;
          background:
            radial-gradient(circle at 18px 18px, rgba(255,255,255,.85) 0 5px, transparent 5.5px),
            radial-gradient(circle at calc(100% - 18px) 18px, rgba(255,255,255,.85) 0 5px, transparent 5.5px),
            radial-gradient(circle at 18px calc(100% - 18px), rgba(255,255,255,.85) 0 5px, transparent 5.5px),
            radial-gradient(circle at calc(100% - 18px) calc(100% - 18px), rgba(255,255,255,.85) 0 5px, transparent 5.5px),
            #4a6d99;
          transition: box-shadow .2s ease;
        }

        .rt-panel.in-tune {
          box-shadow: 0 0 0 3px #8ff0b6;
        }

        .rt-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
        }

        .rt-ref-select {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--muted);
        }

        .rt-ref-select select {
          background: rgba(255,255,255,.16);
          color: #fff;
          border: 0;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 14px;
        }

        .rt-ref-select select option {
          color: #183055;
        }

        .rt-instruments {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .rt-instrument-btn {
          padding: 8px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
        }

        .rt-instrument-btn.active {
          background: #fff;
          color: #1f4f8f;
        }

        .rt-gauge-wrap {
          width: 100%;
          max-width: 460px;
          height: 190px;
          margin: 8px auto 0;
        }

        .rt-note-display {
          text-align: center;
          margin-top: 4px;
        }

        .rt-note {
          font-size: 64px;
          font-weight: 700;
          line-height: 1;
        }

        .rt-octave {
          font-size: 24px;
          margin-left: 4px;
          vertical-align: sub;
          color: var(--muted);
        }

        .rt-freq {
          margin-top: 6px;
          font-size: 15px;
          color: var(--muted);
        }

        .rt-status {
          text-align: center;
          margin: 10px 0 16px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .rt-string-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 22px;
        }

        .rt-string-chip {
          min-width: 52px;
          padding: 8px 12px;
          border-radius: 999px;
          text-align: center;
          background: rgba(255,255,255,.14);
          font-size: 15px;
          font-weight: 600;
        }

        .rt-string-chip.active {
          background: #8ff0b6;
          color: #14432a;
        }

        .rt-footswitch {
          display: block;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          padding: 15px;
          border-radius: 999px;
          background: #fff;
          color: #1f4f8f;
          font-size: 16px;
          font-weight: 700;
        }

        .rt-footswitch.on {
          background: #ff9a8c;
          color: #5a1810;
        }

        .rt-error {
          margin-top: 14px;
          text-align: center;
          font-size: 14px;
          color: #ffd0c9;
        }

        .rt-hint {
          margin-top: 14px;
          text-align: center;
          font-size: 14px;
          color: var(--muted);
        }

        @media (max-width: 600px) {
          .rt-panel { padding: 30px 20px 24px; }
        }
      `}</style>

      <style>{`
        .rt-root { --green: #19845b; --amber: #a86500; --red: #bd4338; --cream: #172432; --muted: #68778b; width: 100%; }
        .rt-panel { box-sizing: border-box; max-width: 920px; margin: 12px auto 0; padding: 26px 30px; border: 1px solid #dce2e8; border-radius: 3px; color: #172432; background: #fff; box-shadow: none; }
        .rt-panel.in-tune { border-left: 3px solid var(--green); box-shadow: none; }
        .rt-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 22px; padding-bottom: 20px; border-bottom: 1px solid #e2e7ec; }
        .rt-panel-intro .rt-kicker { color: #315ce8; font-size: 11px; font-weight: 750; letter-spacing: .12em; }
        .rt-panel-intro h2 { margin: 7px 0 5px; color: #172432; font-size: 22px; letter-spacing: -.025em; }
        .rt-panel-intro p { margin: 0; color: #68778b; font-size: 13px; }
        .rt-ref-select { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; color: #59687a; font-size: 12px; font-weight: 650; }
        .rt-ref-select select { min-width: 132px; padding: 9px 30px 9px 10px; border: 1px solid #d7dee6; border-radius: 3px; background: #fff; color: #172432; font-size: 13px; }
        .rt-instruments-wrap { display: flex; align-items: center; gap: 18px; margin: 18px 0; }
        .rt-label { color: #59687a; font-size: 12px; font-weight: 700; }
        .rt-instruments { justify-content: flex-start; gap: 6px; margin: 0; }
        .rt-instrument-btn { min-width: 92px; padding: 9px 14px; border: 1px solid #d9e0e7; border-radius: 3px; background: #fff; color: #475569; font-size: 13px; font-weight: 650; }
        .rt-instrument-btn.active { border-color: #315ce8; background: #315ce8; color: #fff; }
        .rt-tuning-section { padding: 17px 0 19px; border-top: 1px solid #e2e7ec; border-bottom: 1px solid #e2e7ec; }
        .rt-tuning-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 11px; }
        .rt-tuning-heading p { margin: 4px 0 0; color: #68778b; font-size: 12px; }
        .rt-selected-tuning { color: #315ce8; font-size: 12px; font-weight: 700; }
        .rt-tuning-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
        .rt-tuning-option { display: flex; min-width: 0; min-height: 60px; flex-direction: column; align-items: flex-start; justify-content: center; gap: 5px; padding: 9px 10px; border: 1px solid #dce2e8; border-radius: 3px; background: #fff; color: #172432; text-align: left; cursor: pointer; transition: border-color .15s ease, background .15s ease; }
        .rt-tuning-option strong { font-size: 12px; line-height: 1.2; }
        .rt-tuning-option span { color: #68778b; font-size: 10px; line-height: 1.35; }
        .rt-tuning-option:hover { border-color: #9aadd0; background: #f8faff; }
        .rt-tuning-option.active { border-color: #315ce8; background: #f2f5ff; box-shadow: inset 0 -2px #315ce8; }
        .rt-tuning-option:focus-visible { outline: 2px solid #315ce8; outline-offset: 2px; }
        .rt-main-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(245px, .8fr); border-top: 1px solid #e2e7ec; border-bottom: 1px solid #e2e7ec; }
        .rt-readout { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0; padding: 8px 22px 22px 10px; border-right: 1px solid #e2e7ec; }
        .rt-gauge-wrap { max-width: 420px; height: 172px; margin: 0 auto; }
        .rt-note-display { margin-top: -1px; text-align: center; }
        .rt-note { color: #172432; font-size: 72px; font-weight: 700; letter-spacing: -.05em; line-height: .95; }
        .rt-octave { color: #68778b; font-size: 23px; }
        .rt-freq { margin-top: 8px; color: #68778b; font-size: 14px; font-variant-numeric: tabular-nums; }
        .rt-status { margin: 12px 0 0; color: #68778b; font-size: 12px; font-weight: 750; letter-spacing: .08em; }
        .rt-controls { display: flex; flex-direction: column; gap: 16px; min-width: 0; padding: 21px 2px 20px 22px; }
        .rt-control-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .rt-control-heading > span:last-child { color: #68778b; font-size: 12px; }
        .rt-string-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin: 10px 0 0; }
        .rt-string-chip { min-width: 0; padding: 9px 4px; border: 1px solid #dce2e8; border-radius: 3px; background: #fff; color: #475569; font-size: 14px; font-variant-numeric: tabular-nums; }
        .rt-string-chip.active { border-color: #315ce8; background: #eef3ff; color: #2449c8; }
        .rt-string-chip.active.in-tune { border-color: #19845b; background: #edf8f2; color: #176b4b; }
        .rt-target { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 4px 12px; padding: 13px 14px; border-left: 2px solid #315ce8; background: #f5f7fa; }
        .rt-target > span:first-child { color: #68778b; font-size: 12px; }
        .rt-target strong { grid-row: span 2; color: #172432; font-size: 23px; font-variant-numeric: tabular-nums; }
        .rt-target > span:last-child { color: #475569; font-size: 12px; }
        .rt-hint { margin: 0; color: #68778b; font-size: 12px; line-height: 1.5; text-align: left; }
        .rt-footer { display: flex; flex-direction: column; align-items: center; gap: 9px; padding-top: 20px; }
        .rt-footswitch { max-width: 320px; padding: 13px 18px; border: 0; border-radius: 3px; background: #315ce8; color: #fff; font-size: 14px; font-weight: 700; }
        .rt-footswitch:hover { background: #2449c8; }
        .rt-footswitch.on { background: #bd4338; color: #fff; }
        .rt-footer-note { color: #68778b; font-size: 12px; text-align: center; }
        .rt-error { margin-top: 4px; color: #bd4338; }
        @media (max-width: 760px) {
          .rt-panel { padding: 21px 20px; }
          .rt-main-grid { grid-template-columns: 1fr; }
          .rt-readout { padding: 6px 6px 19px; border-right: 0; border-bottom: 1px solid #e2e7ec; }
          .rt-controls { padding: 19px 2px 20px; }
        }
        @media (max-width: 520px) {
          .rt-panel { margin-top: 8px; padding: 17px 14px; }
          .rt-panel-head { flex-direction: column; gap: 15px; }
          .rt-ref-select { width: 100%; }
          .rt-ref-select select { width: 100%; }
          .rt-instruments-wrap { align-items: flex-start; flex-direction: column; gap: 8px; }
          .rt-instruments { width: 100%; }
          .rt-instrument-btn { min-width: 0; flex: 1; padding-inline: 8px; }
          .rt-tuning-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .rt-tuning-option { min-height: 58px; padding: 8px; }
          .rt-gauge-wrap { height: 145px; }
          .rt-note { font-size: 62px; }
        }
      `}</style>

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
              <span className="rt-note" style={{ color: reading && reading.active ? statusColor : "var(--cream)" }}>
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
            <div className="rt-status" style={{ color: statusColor }}>
              {running ? statusText : "PRONTO PARA AFINAR"}
            </div>
          </section>

          <aside className="rt-controls">
            <div className="rt-control-group">
              <div className="rt-control-heading">
                <span className="rt-label">Notas da afinação</span>
                <span>{instrument}</span>
              </div>
              <div className="rt-string-row">
                {selectedTuning.strings.map((s) => {
                  const selected = reading && reading.active && reading.stringName === s.name;
                  const tuned = selected && Math.abs(reading.stringCents) <= IN_TUNE_CENTS;
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
              <span>Corda mais próxima</span>
              <strong>{reading && reading.active ? reading.stringName : "—"}</strong>
              <span>
                {reading && reading.active
                  ? `${reading.stringCents >= 0 ? "+" : ""}${reading.stringCents.toFixed(1)} cents`
                  : "Aguardando sinal"}
              </span>
            </div>

            <p className="rt-hint">Toque uma corda por vez, o mais próximo do microfone possível.</p>
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
      <g style={{ transition: "transform 0.15s ease-out" }} transform={`rotate(${angle} ${cx} ${cy})`}>
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
