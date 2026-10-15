import { useEffect, useState } from "react";

import {
    apagarIdentificadorDeAcesso,
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
        if (valor === "declined") apagarIdentificadorDeAcesso();
        else salvarConsentimentoAcessos(valor);
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
                    Se você permitir, usamos um identificador aleatório guardado neste navegador para contar entradas,
                    sessões, dias ativos e frequência. O monitor não associa esses registros à conta, ao nome ou ao e-mail,
                    e o Riff Theory não grava o IP nesse relatório. O identificador é pseudônimo, não um IP nem uma
                    garantia de anonimato absoluto. Você pode recusar e usar o site normalmente; pode mudar esta escolha
                    em “Privacidade e acessos”. Revogar interrompe registros futuros, mas não apaga automaticamente
                    registros anteriores do banco.
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
