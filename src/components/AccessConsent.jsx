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
            <div className="access-consent-copy">
                <strong id="access-consent-title">Controle de acessos</strong>
                <p>
                    Você decide se autoriza a contagem anônima de visitas. Essa escolha é opcional e não muda o acesso às ferramentas.
                </p>
                <details>
                    <summary>O que é registrado?</summary>
                    <p>
                        Se permitir, usamos um identificador aleatório assinado no servidor para contar entradas e sessões deste navegador. Os relatórios são diários, no horário de Brasília. O Riff Theory não associa o identificador à conta, nome ou e-mail nem coleta IP. O Cloudflare Turnstile pode processar dados técnicos da conexão durante a verificação.
                    </p>
                </details>
            </div>
            <div className="access-consent-actions" aria-label="Escolha de monitoramento">
                <button type="button" className="access-consent-primary" onClick={() => escolher("accepted")}>
                    Permitir
                </button>
                <button type="button" className="access-consent-secondary" onClick={() => escolher("declined")}>
                    Não permitir
                </button>
            </div>
        </aside>
    );
}
