import { useEffect, useState } from "react";

import {
    lerConsentimentoAcessos,
    registrarAcessoAnonimo,
    salvarConsentimentoAcessos,
} from "../utils/accessMonitor";
import "./AccessConsent.css";

export default function AccessConsent() {
    const [consentimento, setConsentimento] = useState(lerConsentimentoAcessos);
    const [mostrar, setMostrar] = useState(() => !lerConsentimentoAcessos());

    useEffect(() => {
        if (consentimento === "accepted") registrarAcessoAnonimo();
    }, [consentimento]);

    function escolher(valor) {
        salvarConsentimentoAcessos(valor);
        setConsentimento(valor);
        setMostrar(false);
    }

    if (consentimento && !mostrar) {
        return (
            <button className="access-consent-manage" type="button" onClick={() => setMostrar(true)}>
                Privacidade e acessos
            </button>
        );
    }

    return (
        <aside className="access-consent" role="dialog" aria-labelledby="access-consent-title">
            <div>
                <strong id="access-consent-title">Controle de acessos</strong>
                    <p>
                        Se permitir, usamos um identificador aleatório assinado no servidor para contar entradas e sessões deste
                        navegador. Os relatórios são diários, em horário de Brasília, e mantêm o histórico para acompanhar o
                        crescimento. Não associamos o identificador à conta, nome ou e-mail e o Riff Theory não coleta nem
                        armazena IP. Para reduzir registros automatizados, a verificação é feita pelo Cloudflare Turnstile, que
                        pode processar dados técnicos da conexão durante o desafio. Você pode revisar esta informação em
                        “Privacidade e acessos”.
                    </p>
                </div>
                <div className="access-consent-actions">
                    <button type="button" className="access-consent-primary" onClick={() => escolher("accepted")}>
                        Permitir monitoramento anônimo
                    </button>
                </div>
        </aside>
    );
}
