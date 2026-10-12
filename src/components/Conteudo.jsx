import React from "react";
import Icone from "./Icone";
import AuthButton from "./AuthButton";
import { GOOGLE_LOGIN_UI_ENABLED } from "../auth/featureFlags";

// Área principal: abas de ferramentas no topo, página atual e o botão
// flutuante que abre o assistente (chat).
export default function Conteudo({ page, setPage, pageData, sidebarCollapsed, onToggleSidebar }) {
    const abas = Object.entries(pageData).filter(([, item]) => item.aba);

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
                <span className="mobile-brand"><img src="/icon.jpg" alt="" title="Riff Theory" /><strong>riff<span>theory</span></strong></span>
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
                    aria-label="Abrir assistente Thonic"
                    onClick={() => setPage("Chatbot")}
                >
                    <img src="/thonic.webp" alt="" />
                </button>
            )}
        </main>
    );
}
