import { useAuth } from "../auth/AuthContext";
import "./AuthButton.css";

export default function AuthButton({ compact = false }) {
    const { user, loading, error, authConfigured, signInWithGoogle, signOut, getAvatarUrl, getDisplayName } = useAuth();
    const avatarUrl = getAvatarUrl(user);
    const name = getDisplayName(user);

    if (loading) {
        return <div className={`auth-card${compact ? " compact" : ""}`} aria-live="polite">Carregando conta...</div>;
    }

    if (!user) {
        return (
            <div className={`auth-card${compact ? " compact" : ""}`}>
                <button className="auth-login" onClick={signInWithGoogle} type="button">
                    <span className="google-mark" aria-hidden="true">G</span>
                    <span>Entrar com Google</span>
                </button>
                {!authConfigured && <small className="auth-hint">Login será habilitado na configuração final.</small>}
                {error && <small className="auth-error" role="alert">{error}</small>}
            </div>
        );
    }

    return (
        <div className={`auth-card auth-logged${compact ? " compact" : ""}`}>
            <div className="auth-user">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={`Foto de perfil de ${name}`} className="auth-avatar" />
                ) : (
                    <span className="auth-avatar auth-initial" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
                )}
                <span className="auth-name" title={name}>{name}</span>
            </div>
            <button className="auth-logout" onClick={signOut} type="button">Sair</button>
            {error && <small className="auth-error" role="alert">{error}</small>}
        </div>
    );
}
