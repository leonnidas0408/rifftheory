const SAMPLES = [
    { midi: 48, src: "/audio/guitar-c3.ogg" },
    { midi: 52, src: "/audio/guitar-e3.ogg" },
];

const templates = new Map();
let contextoFallback = null;

function sampleMaisProximo(midi) {
    return SAMPLES.reduce((melhor, atual) => (
        Math.abs(atual.midi - midi) < Math.abs(melhor.midi - midi) ? atual : melhor
    ));
}

function tocarFallback(midi, duracao) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    contextoFallback ??= new AudioContextClass();
    const contexto = contextoFallback;
    if (contexto.state === "suspended") contexto.resume();
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

/** Toca uma nota de guitarra real e usa síntese apenas se o sample falhar. */
export function tocarNota(midi, duracao = 1.8) {
    if (typeof window === "undefined" || !Number.isFinite(midi)) return;
    const AudioClass = window.Audio;
    if (!AudioClass) return tocarFallback(midi, duracao);

    const base = sampleMaisProximo(midi);
    let template = templates.get(base.src);
    if (!template) {
        template = new AudioClass(base.src);
        template.preload = "auto";
        templates.set(base.src, template);
    }

    const audio = template.cloneNode();
    audio.volume = 0.52;
    audio.playbackRate = Math.min(2.7, Math.max(0.55, 2 ** ((midi - base.midi) / 12)));
    audio.currentTime = 0;

    const parar = window.setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
    }, duracao * 1000);

    const tentativa = audio.play();
    tentativa?.catch(() => {
        window.clearTimeout(parar);
        tocarFallback(midi, duracao);
    });
}
