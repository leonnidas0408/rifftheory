import { useEffect, useState } from "react";

import {
    lerConsentimentoAcessos,
    registrarAcessoAnonimo,
    salvarConsentimentoAcessos,
} from "../utils/accessMonitor";
import "./AccessConsent.css";

export default function AccessConsent() {
    const [consentimento, setConsentimento] = useState(lerConsentimentoAcessos);

    useEffect(() => {
        if (consentimento === "accepted") registrarAcessoAnonimo();
    }, [consentimento]);

    function escolher(valor) {
        salvarConsentimentoAcessos(valor);
        setConsentimento(valor);
    }

    if (consentimento) return null;

    return (
        <aside className="access-consent" aria-labelledby="access-consent-title">
            <div>
                <strong id="access-consent-title">Controle de acessos</strong>
                <p>Opcional: contamos entradas com um identificador aleatório, sem nome, conta ou IP. A verificação antirobô pode processar dados técnicos da conexão.</p>
                <a className="access-consent-policy" href="/privacidade/">Ler a política de privacidade</a>
            </div>
            <div className="access-consent-actions">
                <button type="button" className="access-consent-secondary" onClick={() => escolher("declined")}>Não permitir</button>
                <button type="button" className="access-consent-primary" onClick={() => escolher("accepted")}>Permitir</button>
            </div>
        </aside>
    );
}
