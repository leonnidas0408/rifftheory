import React from "react";
import Icone from "./Icone";
import AuthButton from "./AuthButton";
import { GOOGLE_LOGIN_UI_ENABLED } from "../auth/featureFlags";
import { THONIC_BALOES, lerBaloesAtivos } from "./thonicBaloes";

// Área principal: abas de ferramentas no topo, página atual e o botão
// flutuante que abre o assistente (chat).
export default function Conteudo({ page, setPage, pageData, sidebarCollapsed, onToggleSidebar }) {
    const abas = Object.entries(pageData).filter(([, item]) => item.aba);
    const [baloesAtivos, setBaloesAtivos] = React.useState(lerBaloesAtivos);
    const [balaoAtual, setBalaoAtual] = React.useState(-1);
    const [balaoVisivel, setBalaoVisivel] = React.useState(false);
    const timerBalaoRef = React.useRef(null);

    React.useEffect(() => {
        const atualizar = (evento) => {
            const ativo = evento.detail?.baloesAtivos ?? lerBaloesAtivos();
            setBaloesAtivos(ativo);
            if (!ativo) setBalaoVisivel(false);
        };
        window.addEventListener("storage", atualizar);
        window.addEventListener("riff-thonic-bubble-settings", atualizar);
        return () => {
            window.removeEventListener("storage", atualizar);
            window.removeEventListener("riff-thonic-bubble-settings", atualizar);
        };
    }, []);

    React.useEffect(() => {
        window.clearTimeout(timerBalaoRef.current);
        setBalaoVisivel(false);
        if (page === "Chatbot" || !baloesAtivos) return undefined;

        const mostrarBalao = () => {
            setBalaoAtual((atual) => (atual + 1) % THONIC_BALOES.length);
            setBalaoVisivel(true);
            timerBalaoRef.current = window.setTimeout(() => setBalaoVisivel(false), 14000);
        };
        const intervalo = window.setInterval(mostrarBalao, 180000);
        return () => {
            window.clearInterval(intervalo);
            window.clearTimeout(timerBalaoRef.current);
        };
    }, [page, baloesAtivos]);

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
                <div className="fab-chat-wrap">
                    <button
                        className={`fab-chat-callout${balaoVisivel ? " is-visible" : ""}`}
                        type="button"
                        onClick={() => setPage("Chatbot")}
                        aria-label={balaoAtual >= 0 ? THONIC_BALOES[balaoAtual].alt : "Abrir conversa com o Thonic"}
                        aria-hidden={!balaoVisivel}
                        tabIndex={balaoVisivel ? 0 : -1}
                    >
                        {balaoAtual >= 0 && <img src={THONIC_BALOES[balaoAtual].src} alt="" />}
                    </button>
                    <button
                        className="fab-chat"
                        type="button"
                        aria-label="Abrir assistente Thonic"
                        onClick={() => setPage("Chatbot")}
                    >
                        <img className="fab-chat-logo" src="/thonic-waveform-speaking.gif" alt="Thonic" width="60" height="60" />
                    </button>
                </div>
            )}
        </main>
    );
}
