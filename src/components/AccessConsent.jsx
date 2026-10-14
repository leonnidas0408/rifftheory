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
        <aside className="access-consent" role="dialog" aria-labelledby="access-consent-title">
            <div>
                <strong id="access-consent-title">Controle de acessos</strong>
                <p>
                    Podemos registrar uma identificação anônima deste dispositivo para contar entradas,
                    sessões, dias ativos e frequência de uso. Não coletamos IP, nome, e-mail ou senha.
                    Você pode recusar e continuar usando o Riff Theory normalmente.
                </p>
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
