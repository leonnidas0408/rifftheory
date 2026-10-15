import { supabase } from "../auth/supabase";

const CONSENT_KEY = "riffTheoryAccessConsent";
const DEVICE_KEY = "riffTheoryAnonymousDeviceId";
const SIGNATURE_KEY = "riffTheoryAnonymousDeviceSignature";
const SESSION_KEY = "riffTheoryAccessSessionId";
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();

let turnstileScriptPromise = null;

function idAleatorio(prefixo) {
    if (globalThis.crypto?.randomUUID) return `${prefixo}_${globalThis.crypto.randomUUID()}`;
    const aleatorio = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefixo}_${aleatorio}`;
}

function lerOuCriar(chave, prefixo, armazenamento = window.localStorage) {
    try {
        const atual = armazenamento.getItem(chave);
        if (atual) return atual;
        const novo = idAleatorio(prefixo);
        armazenamento.setItem(chave, novo);
        return novo;
    } catch {
        return idAleatorio(prefixo);
    }
}

function carregarTurnstile() {
    if (window.turnstile?.render) return Promise.resolve();
    if (!turnstileScriptPromise) {
        turnstileScriptPromise = new Promise((resolve, reject) => {
            const scriptExistente = document.querySelector("script[data-riff-turnstile]");
            const script = scriptExistente || document.createElement("script");
            const temporizador = window.setTimeout(() => {
                turnstileScriptPromise = null;
                reject(new Error("Tempo esgotado ao carregar a verificação antirobô."));
            }, 15000);
            const aoCarregar = () => {
                window.clearTimeout(temporizador);
                if (window.turnstile?.render) resolve();
                else {
                    turnstileScriptPromise = null;
                    reject(new Error("A verificação antirobô não ficou disponível."));
                }
            };
            const aoFalhar = () => {
                window.clearTimeout(temporizador);
                turnstileScriptPromise = null;
                reject(new Error("Não foi possível carregar a verificação antirobô."));
            };

            script.addEventListener("load", aoCarregar, { once: true });
            script.addEventListener("error", aoFalhar, { once: true });
            if (!scriptExistente) {
                script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
                script.async = true;
                script.defer = true;
                script.dataset.riffTurnstile = "true";
                document.head.appendChild(script);
            }
        });
    }
    return turnstileScriptPromise;
}

async function obterTokenTurnstile() {
    if (!TURNSTILE_SITE_KEY) throw new Error("A verificação antirobô ainda não foi configurada.");
    await carregarTurnstile();

    return new Promise((resolve, reject) => {
        const container = document.createElement("div");
        container.setAttribute("aria-hidden", "true");
        Object.assign(container.style, {
            position: "fixed",
            left: "-10000px",
            top: "0",
            width: "1px",
            height: "1px",
            overflow: "hidden",
        });
        document.body.appendChild(container);

        let widgetId = null;
        let concluido = false;
        const temporizador = window.setTimeout(() => finalizar(reject, new Error("A verificação antirobô expirou.")), 45000);
        const finalizar = (callback, valor) => {
            if (concluido) return;
            concluido = true;
            window.clearTimeout(temporizador);
            if (widgetId !== null) {
                try { window.turnstile.remove(widgetId); } catch { /* limpeza opcional */ }
            }
            container.remove();
            callback(valor);
        };

        try {
            widgetId = window.turnstile.render(container, {
                sitekey: TURNSTILE_SITE_KEY,
                size: "invisible",
                action: "access_monitor",
                callback: (token) => finalizar(resolve, token),
                "error-callback": () => finalizar(reject, new Error("A verificação antirobô falhou.")),
                "expired-callback": () => finalizar(reject, new Error("A verificação antirobô expirou.")),
                "timeout-callback": () => finalizar(reject, new Error("A verificação antirobô excedeu o tempo.")),
            });
            window.turnstile.execute(widgetId);
        } catch (erro) {
            finalizar(reject, erro);
        }
    });
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
        window.localStorage.removeItem(SIGNATURE_KEY);
        window.sessionStorage.removeItem(SESSION_KEY);
        window.localStorage.setItem(CONSENT_KEY, "declined");
    } catch {
        // A limpeza local não deve interromper a navegação.
    }
}

export async function registrarAcessoAnonimo() {
    if (!supabase || lerConsentimentoAcessos() !== "accepted" || !TURNSTILE_SITE_KEY) return;

    const deviceId = lerOuCriar(DEVICE_KEY, "device");
    const sessionId = lerOuCriar(SESSION_KEY, "session", window.sessionStorage);

    try {
        const token = await obterTokenTurnstile();
        const deviceSignature = window.localStorage.getItem(SIGNATURE_KEY);
        const { data, error } = await supabase.functions.invoke("register-anonymous-access", {
            body: {
                p_device_id: deviceId,
                p_session_id: sessionId,
                device_signature: deviceSignature,
                turnstile_token: token,
            },
        });

        if (error) return;
        if (typeof data?.device_signature === "string") {
            window.localStorage.setItem(SIGNATURE_KEY, data.device_signature);
        }
    } catch {
        // Analytics nunca deve impedir o uso do site; falhas não bloqueiam a navegação.
    }
}
