const SAMPLES = [
    { midi: 48, src: "/audio/guitar-c3.ogg" },
    { midi: 52, src: "/audio/guitar-e3.ogg" },
];

const buffers = new Map();
let contextoAudio = null;

function obterContexto() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    contextoAudio ??= new AudioContextClass();
    if (contextoAudio.state === "suspended") contextoAudio.resume();
    return contextoAudio;
}

function sampleMaisProximo(midi) {
    return SAMPLES.reduce((melhor, atual) => (
        Math.abs(atual.midi - midi) < Math.abs(melhor.midi - midi) ? atual : melhor
    ));
}

function carregarBuffer(src, contexto) {
    if (!buffers.has(src)) {
        buffers.set(src, fetch(src)
            .then((resposta) => {
                if (!resposta.ok) throw new Error(`Falha ao carregar ${src}`);
                return resposta.arrayBuffer();
            })
            .then((dados) => contexto.decodeAudioData(dados)));
    }
    return buffers.get(src);
}

function tocarFallback(midi, duracao, contexto) {
    if (!contexto) return;
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    const agora = contexto.currentTime;
    oscilador.type = "triangle";
    oscilador.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(0.11, agora + 0.01);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
    oscilador.connect(ganho).connect(contexto.destination);
    oscilador.start(agora);
    oscilador.stop(agora + duracao + 0.05);
}

/** Toca uma nota real de guitarra e transpõe exatamente pela distância em semitons. */
export function tocarNota(midi, duracao = 1.8) {
    if (typeof window === "undefined" || !Number.isFinite(midi)) return;
    const contexto = obterContexto();
    if (!contexto) return;

    const base = sampleMaisProximo(midi);
    carregarBuffer(base.src, contexto)
        .then((buffer) => {
            const agora = contexto.currentTime;
            const fonte = contexto.createBufferSource();
            const ganho = contexto.createGain();
            const ajusteDePitch = 2 ** ((midi - base.midi) / 12);
            const tempoDoSample = Math.min(duracao, buffer.duration / ajusteDePitch);

            fonte.buffer = buffer;
            fonte.playbackRate.value = ajusteDePitch;
            ganho.gain.setValueAtTime(0.0001, agora);
            ganho.gain.exponentialRampToValueAtTime(0.62, agora + 0.012);
            ganho.gain.exponentialRampToValueAtTime(0.0001, agora + Math.max(0.12, tempoDoSample - 0.04));
            fonte.connect(ganho).connect(contexto.destination);
            fonte.start(agora);
            fonte.stop(agora + tempoDoSample + 0.05);
        })
        .catch(() => tocarFallback(midi, duracao, contexto));
}
