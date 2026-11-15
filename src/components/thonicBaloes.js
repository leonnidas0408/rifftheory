export const THONIC_BALOES_ATIVOS_KEY = "riffTheoryThonicBaloesAtivos";

export const THONIC_BALOES = [
    { src: "/thonic-bubbles/thonic-balao-acorde.png", alt: "Quer tirar uma dúvida musical?" },
    { src: "/thonic-bubbles/thonic-balao-harmonia.png", alt: "Vamos encontrar o acorde certo?" },
    { src: "/thonic-bubbles/thonic-balao-escala.png", alt: "Quer entender essa escala?" },
    { src: "/thonic-bubbles/thonic-balao-chat.png", alt: "Me conte seu riff!" },
];

export function lerBaloesAtivos() {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(THONIC_BALOES_ATIVOS_KEY) !== "0";
}
