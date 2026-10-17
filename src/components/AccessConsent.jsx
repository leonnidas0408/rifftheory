import { useEffect, useState } from "react";

import {
    apagarIdentificadorDeAcesso,
    lerConsentimentoAcessos,
    registrarAcessoAnonimo,
    salvarConsentimentoAcessos,
} from "../utils/accessMonitor";
import "./AccessConsent.css";

const CONSENT_CHANGED_EVENT = "riff:access-consent-changed";

export function AccessConsentInline() {
    return <AccessConsent inline />;
}

export function AccessConsentManager() {
    return <AccessConsent />;
}

export default function AccessConsent({ inline = false }) {
    const [consentimento, setConsentimento] = useState(lerConsentimentoAcessos);
    const [mostrar, setMostrar] = useState(() => inline && !lerConsentimentoAcessos());

    useEffect(() => {
        function sincronizarConsentimento(evento) {
            const valor = evento.detail ?? lerConsentimentoAcessos();
            setConsentimento(valor);
            setMostrar(false);
        }

        window.addEventListener(CONSENT_CHANGED_EVENT, sincronizarConsentimento);
        return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sincronizarConsentimento);
    }, []);

    useEffect(() => {
        if (!inline && consentimento === "accepted") registrarAcessoAnonimo();
    }, [consentimento, inline]);

    function escolher(valor) {
        if (valor === "declined") apagarIdentificadorDeAcesso();
        else salvarConsentimentoAcessos(valor);
        setConsentimento(valor);
        setMostrar(false);
        window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: valor }));
    }

    if (!mostrar) {
        if (inline) {
            return (
                <button className="access-consent-manage-inline" type="button" onClick={() => setMostrar(true)}>
                    Privacidade e acessos
                </button>
            );
        }

        return (
            <button className="access-consent-manage" type="button" onClick={() => setMostrar(true)}>
                Privacidade e acessos
            </button>
        );
    }

    return (
        <aside
            className={`access-consent${inline ? " access-consent-inline" : ""}`}
            role="dialog"
            aria-labelledby={inline ? "access-consent-title-inline" : "access-consent-title-global"}
        >
            <div className="access-consent-copy">
                <strong id={inline ? "access-consent-title-inline" : "access-consent-title-global"}>
                    Controle de acessos
                </strong>
                <p>A contagem anônima de acessos é opcional. Recusar não impede o uso do Riff Theory.</p>
                <details className="access-consent-details">
                    <summary>Como funciona a contagem?</summary>
                    <p>
                        Se permitir, usamos um identificador aleatório assinado no servidor para contar entradas e sessões deste
                        navegador. Os relatórios são diários, em horário de Brasília, e mantêm o histórico para acompanhar o
                        crescimento. Não associamos o identificador à conta, nome ou e-mail e o Riff Theory não coleta nem
                        armazena IP. Para reduzir registros automatizados, a verificação é feita pelo Cloudflare Turnstile, que
                        pode processar dados técnicos da conexão durante o desafio. Você pode recusar e usar o site normalmente;
                        pode mudar a escolha em “Privacidade e acessos”. Revogar interrompe registros futuros, mas não apaga
                        automaticamente registros anteriores.
                    </p>
                </details>
            </div>
            <div className="access-consent-actions">
                <button type="button" className="access-consent-secondary" onClick={() => escolher("declined")}>
                    Não permitir
                </button>
                <button type="button" className="access-consent-primary" onClick={() => escolher("accepted")}>
                    Permitir monitoramento anônimo
                </button>
            </div>
        </aside>
    );
}
