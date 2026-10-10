import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authConfigured, getAvatarUrl, getDisplayName, supabase } from "./supabase";

const AuthContext = createContext(null);

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
            setSession(data.session);
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

    async function signInWithGoogle() {
        setError("");
        if (!supabase) {
            setError("Login Google ainda não foi configurado neste ambiente.");
            return { error: new Error("Supabase não configurado") };
        }

        const { error: signInError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin },
        });

        if (signInError) setError("Não foi possível iniciar o login Google.");
        return { error: signInError };
    }

    async function signOut() {
        if (!supabase) return;
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) setError("Não foi possível sair agora.");
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
