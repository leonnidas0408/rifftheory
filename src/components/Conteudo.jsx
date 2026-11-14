import React from "react";
import Icone from "./Icone";
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
            "Quer conversar sobre teoria musical?",
            "Dúvidas sobre acordes? Pode perguntar.",
            "Explore escalas e seus usos.",
            "Vamos falar de harmonia?",
        ];
        let timerId;
        let phraseIndex = 0;
        let cancelled = false;

        const showBubble = () => {
            if (cancelled) return;
            setBubbleText(frases[phraseIndex % frases.length]);
            phraseIndex += 1;
            setBubbleVisible(true);
            timerId = window.setTimeout(() => {
                setBubbleVisible(false);
                timerId = window.setTimeout(showBubble, 22000);
            }, 5000);
        };

        timerId = window.setTimeout(showBubble, 2500);
        return () => {
            cancelled = true;
            window.clearTimeout(timerId);
        };
    }, [page, reducedMotion]);

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
                        setBubbleVisible(false);
                        setPage("Chatbot");
                    }}
                >
                    <img className="fab-chat-logo" src="/thonic.webp" alt="" width="42" height="42" loading="lazy" decoding="async" />
                    <span className={`fab-chat-tip${bubbleVisible ? " fab-chat-tip-visible" : ""}`} aria-hidden="true">
                        {bubbleText}
                    </span>
                </button>
            )}
        </main>
    );
}
