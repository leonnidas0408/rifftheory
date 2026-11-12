import React, { useEffect, useState } from "react";
import AuthButton from "./AuthButton";
import { GOOGLE_LOGIN_UI_ENABLED } from "../auth/featureFlags";
import AccessConsent from "./AccessConsent";

// Área principal: consentimento, tela ativa e botão flutuante do assistente.
export default function Conteudo({ page, setPage, pageData, sidebarCollapsed, onToggleSidebar }) {
    const [heroVisivel, setHeroVisivel] = useState(page === "Início");

    useEffect(() => {
        if (page !== "Início") {
            setHeroVisivel(false);
            return undefined;
        }

        const hero = document.querySelector(".conteudo .hero");
        if (!hero || typeof IntersectionObserver === "undefined") {
            setHeroVisivel(false);
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            setHeroVisivel(entry.isIntersecting);
        }, { threshold: 0.01 });

        observer.observe(hero);
        return () => observer.disconnect();
    }, [page]);

    return (
        <main className={`conteudo${heroVisivel ? " conteudo-hero-visivel" : ""}`}>
            <AccessConsent />
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
            {pageData[page].page}

            {page !== "Chatbot" && (
                <button
                    className="fab-chat"
                    aria-label="Abrir assistente Thonic"
                    onClick={() => setPage("Chatbot")}
                >
                    <img src="/thonic.webp" alt="" width="42" height="42" loading="lazy" decoding="async" />
                </button>
            )}
        </main>
    );
}
