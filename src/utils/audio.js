let contextoAudio = null;

export function tocarNota(midi, duracao = 0.65, tipo = "sine") {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || !Number.isFinite(midi)) return;

    contextoAudio ??= new AudioContextClass();
    const contexto = contextoAudio;
    if (contexto.state === "suspended") contexto.resume();

    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    const agora = contexto.currentTime;
    oscilador.type = tipo;
    oscilador.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(0.18, agora + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
    oscilador.connect(ganho).connect(contexto.destination);
    oscilador.start(agora);
    oscilador.stop(agora + duracao + 0.05);
}
