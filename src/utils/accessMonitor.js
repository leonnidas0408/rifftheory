import { supabase } from "../auth/supabase";

const CONSENT_KEY = "riffTheoryAccessConsent";
const DEVICE_KEY = "riffTheoryAnonymousDeviceId";
const SESSION_KEY = "riffTheoryAccessSessionId";

function idAleatorio(prefixo) {
    if (globalThis.crypto?.randomUUID) return `${prefixo}_${globalThis.crypto.randomUUID()}`;
    const aleatorio = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefixo}_${aleatorio}`;
}

function lerOuCriar(chave, prefixo) {
    try {
        const atual = window.localStorage.getItem(chave);
        if (atual) return atual;
        const novo = idAleatorio(prefixo);
        window.localStorage.setItem(chave, novo);
        return novo;
    } catch {
        return idAleatorio(prefixo);
    }
}

export function lerConsentimentoAcessos() {
    try {
        return window.localStorage.getItem(CONSENT_KEY);
    } catch {
        return null;
    }
}

export function salvarConsentimentoAcessos(valor) {
    try {
        window.localStorage.setItem(CONSENT_KEY, valor);
    } catch {
        // Sem armazenamento, o consentimento vale apenas para esta execução.
    }
}

export function apagarIdentificadorDeAcesso() {
    try {
        window.localStorage.removeItem(DEVICE_KEY);
        window.sessionStorage.removeItem(SESSION_KEY);
        window.localStorage.setItem(CONSENT_KEY, "declined");
    } catch {
        // A limpeza local não deve interromper a navegação.
    }
}

export async function registrarAcessoAnonimo() {
    if (!supabase || lerConsentimentoAcessos() !== "accepted") return;

    const deviceId = lerOuCriar(DEVICE_KEY, "device");
    const sessionId = lerOuCriar(SESSION_KEY, "session");

    try {
        await supabase.rpc("register_anonymous_access", {
            p_device_id: deviceId,
            p_session_id: sessionId,
            p_path: `${window.location.pathname}${window.location.search}`,
            p_user_agent: navigator.userAgent,
        });
    } catch {
        // Analytics nunca deve impedir o uso do site.
    }
}
