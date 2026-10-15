import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authConfigured, getAvatarUrl, getDisplayName, supabase } from "./supabase";

const AuthContext = createContext(null);
const LOGIN_RETURN_KEY = "riff-theory-login-return";

function normalizarRotaInterna(value) {
    try {
        const url = new URL(value, window.location.origin);
        if (url.origin !== window.location.origin) return "";
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return "";
    }
}

function consumirRotaDeRetorno() {
    try {
        const valor = window.sessionStorage.getItem(LOGIN_RETURN_KEY);
        window.sessionStorage.removeItem(LOGIN_RETURN_KEY);
        if (!valor) return "";
        const salvo = JSON.parse(valor);
        if (!salvo?.path || Number(salvo.expiresAt) < Date.now()) return "";
        return normalizarRotaInterna(salvo.path);
    } catch {
        return "";
    }
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(authConfigured);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return undefined;
        }

        let ativo = true;
        supabase.auth.getSession().then(({ data, error: sessionError }) => {
            if (!ativo) return;
            if (sessionError) setError("Não foi possível recuperar sua sessão.");
            const rotaDeRetorno = data.session ? consumirRotaDeRetorno() : "";
            if (rotaDeRetorno && window.location.pathname === "/") {
                window.location.replace(rotaDeRetorno);
                return;
            }
            setSession(data.session);
            setLoading(false);
        }).catch(() => {
            if (!ativo) return;
            setError("Não foi possível recuperar sua sessão. Verifique sua conexão e tente novamente.");
            setSession(null);
            setLoading(false);
        });

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            setLoading(false);
        });

        return () => {
            ativo = false;
            data.subscription.unsubscribe();
        };
    }, []);

    async function signInWithGoogle(redirectTo = window.location.origin) {
        setError("");
        if (!supabase) {
            setError("Login Google ainda não foi configurado neste ambiente.");
            return { error: new Error("Supabase não configurado") };
        }

        try {
            const rotaDeRetorno = normalizarRotaInterna(redirectTo);
            if (rotaDeRetorno && rotaDeRetorno !== "/") {
                window.sessionStorage.setItem(LOGIN_RETURN_KEY, JSON.stringify({
                    path: rotaDeRetorno,
                    expiresAt: Date.now() + 15 * 60 * 1000,
                }));
            }
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin },
            });
            if (signInError) {
                window.sessionStorage.removeItem(LOGIN_RETURN_KEY);
                setError("Não foi possível iniciar o login Google.");
            }
            return { error: signInError };
        } catch (signInError) {
            try { window.sessionStorage.removeItem(LOGIN_RETURN_KEY); } catch { /* armazenamento opcional */ }
            setError("Não foi possível iniciar o login Google. Verifique sua conexão e tente novamente.");
            return { error: signInError };
        }
    }

    async function signOut() {
        if (!supabase) return;
        try {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) setError("Não foi possível sair agora.");
        } catch {
            setError("Não foi possível sair agora. Verifique sua conexão e tente novamente.");
        }
    }

    const value = useMemo(() => ({
        session,
        user: session?.user || null,
        loading,
        error,
        authConfigured,
        signInWithGoogle,
        signOut,
        getAvatarUrl,
        getDisplayName,
    }), [session, loading, error]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
    return context;
}
