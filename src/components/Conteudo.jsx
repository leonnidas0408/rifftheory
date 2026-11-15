import React from "react";
import Icone from "./Icone";
import ThonicAvatar from "./ThonicAvatar";
import AuthButton from "./AuthButton";
import { GOOGLE_LOGIN_UI_ENABLED } from "../auth/featureFlags";

// Área principal: abas de ferramentas no topo, página atual e o botão
// flutuante que abre o assistente (chat).
export default function Conteudo({ page, setPage, pageData, sidebarCollapsed, onToggleSidebar }) {
    const [reducedMotion, setReducedMotion] = React.useState(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
    const [bubbleVisible, setBubbleVisible] = React.useState(false);
    const [bubbleText, setBubbleText] = React.useState("");
    const [falaAtiva, setFalaAtiva] = React.useState(false);
    const [audioBloqueado, setAudioBloqueado] = React.useState(false);
    const falaAtualRef = React.useRef(null);
    const audioRef = React.useRef(null);
    const timerRef = React.useRef(null);
    const abas = Object.entries(pageData).filter(([, item]) => item.aba);

    React.useEffect(() => {
        const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!query) return undefined;

        const onPreferenceChange = (event) => setReducedMotion(event.matches);
        if (query.addEventListener) {
            query.addEventListener("change", onPreferenceChange);
            return () => query.removeEventListener("change", onPreferenceChange);
        }
        query.addListener(onPreferenceChange);
        return () => query.removeListener(onPreferenceChange);
    }, []);

    React.useEffect(() => {
        if (page === "Chatbot" || reducedMotion) {
            setBubbleVisible(false);
            return undefined;
        }

        const frases = [
            { texto: "Quer conversar sobre teoria musical?", audio: "/audio/thonic-global-teoria.wav" },
            { texto: "Dúvidas sobre acordes? Pode perguntar.", audio: "/audio/thonic-global-acordes.wav" },
            { texto: "Explore escalas e seus usos.", audio: "/audio/thonic-global-escalas.wav" },
            { texto: "Vamos falar de harmonia?", audio: "/audio/thonic-global-harmonia.wav" },
        ];
        let cancelled = false;

        const limparAudio = () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            }
            setFalaAtiva(false);
        };

        const agendar = (delay) => {
            timerRef.current = window.setTimeout(showBubble, delay);
        };

        const showBubble = () => {
            if (cancelled) return;
            const frase = frases[Math.floor(Math.random() * frases.length)];
            falaAtualRef.current = frase;
            setBubbleText(frase.texto);
            setBubbleVisible(true);
            limparAudio();
            const audio = new Audio(frase.audio);
            audio.preload = "auto";
            audioRef.current = audio;
            audio.onplay = () => {
                setAudioBloqueado(false);
                setFalaAtiva(true);
            };
            audio.onpause = () => setFalaAtiva(false);
            audio.onended = () => {
                setFalaAtiva(false);
                window.setTimeout(() => setBubbleVisible(false), 900);
            };
            audio.onerror = () => setFalaAtiva(false);
            audio.play().catch(() => setAudioBloqueado(true));
            agendar(22000 + Math.floor(Math.random() * 14000));
        };

        agendar(7000 + Math.floor(Math.random() * 6000));
        return () => {
            cancelled = true;
            window.clearTimeout(timerRef.current);
            limparAudio();
        };
    }, [page, reducedMotion]);

    const tocarFalaAtual = () => {
        const frase = falaAtualRef.current;
        if (!frase) return;
        const audio = audioRef.current || new Audio(frase.audio);
        audioRef.current = audio;
        audio.onplay = () => {
            setAudioBloqueado(false);
            setFalaAtiva(true);
        };
        audio.onpause = () => setFalaAtiva(false);
        audio.onended = () => {
            setFalaAtiva(false);
            window.setTimeout(() => setBubbleVisible(false), 900);
        };
        audio.play().catch(() => setAudioBloqueado(true));
    };

    return (
        <main className="conteudo">
            {sidebarCollapsed && (
                <button
                    className="sidebar-toggle sidebar-toggle-reopen"
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label="Mostrar barra lateral"
                    title="Mostrar barra lateral"
                >
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                </button>
            )}
            <div className="auth-mobile">
                <span className="mobile-brand"><img src="/icon.webp" alt="" title="Riff Theory" width="32" height="32" decoding="async" /><strong>riff<span>theory</span></strong></span>
                {GOOGLE_LOGIN_UI_ENABLED && <AuthButton compact />}
            </div>
            <nav className="abas" aria-label="Ferramentas">
                {abas.map(([chave, item]) => (
                    <button
                        key={chave}
                        className={`aba${page === chave ? " ativa" : ""}`}
                        onClick={() => setPage(chave)}
                    >
                        <Icone nome={item.aba} tamanho={20} />
                        {chave}
                    </button>
                ))}
            </nav>
            {pageData[page].page}
            {page !== "Chatbot" && (
                <button
                    className="fab-chat"
                    type="button"
                    aria-label="Abrir assistente Thonic"
                    onClick={() => {
                        if (bubbleVisible && audioBloqueado) {
                            tocarFalaAtual();
                            return;
                        }
                        setBubbleVisible(false);
                        setPage("Chatbot");
                    }}
                >
                    <ThonicAvatar className="fab-chat-logo" speaking={falaAtiva} alt="Thonic" size={42} />
                    <span className={`fab-chat-tip${bubbleVisible ? " fab-chat-tip-visible" : ""}`} aria-hidden="true">
                        {bubbleText}
                    </span>
                </button>
            )}
        </main>
    );
}
