import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getDisplayName, supabase } from "../../auth/supabase";

const ratingOptions = [1, 2, 3, 4, 5];
const REVIEW_UPDATED_EVENT = "riff:site-reviews-changed";
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/i;

function notificarListaPublica() {
    window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
}

export default function ReviewForm() {
    const { user, loading: authLoading, authConfigured, signInWithGoogle, error: authError } = useAuth();
    const [rating, setRating] = useState("");
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [publicConsent, setPublicConsent] = useState(false);
    const [loadingReview, setLoadingReview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loginStarting, setLoginStarting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState(false);
    const accountName = user ? getDisplayName(user) : "";

    useEffect(() => {
        let active = true;
        setRating("");
        setComment("");
        setPublicConsent(false);
        setSaved(false);
        setConfirmDelete(false);
        setStatus("");
        setError(false);

        if (!user?.id || !supabase) {
            setLoadingReview(false);
            return () => { active = false; };
        }

        setLoadingReview(true);
        (async () => {
            try {
                const { data, error: loadError } = await supabase
                    .from("site_reviews")
                    .select("rating, comment")
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (loadError) throw loadError;
                if (!active) return;

                if (data) {
                    setRating(Number(data.rating));
                    setComment(typeof data.comment === "string" ? data.comment : "");
                    setSaved(true);
                    setStatus("Sua avaliação está publicada e pode ser atualizada ou removida.");
                }
            } catch {
                if (!active) return;
                setError(true);
                setStatus("Não foi possível carregar sua avaliação. Você ainda pode tentar novamente.");
            } finally {
                if (active) setLoadingReview(false);
            }
        })();

        return () => { active = false; };
    }, [user?.id]);

    async function iniciarLoginGoogle() {
        setLoginStarting(true);
        setError(false);
        setStatus("");
        try {
            const { error: signInError } = await signInWithGoogle();
            if (signInError) {
                setError(true);
                setStatus("Não foi possível iniciar o login Google. Tente novamente.");
                setLoginStarting(false);
            }
        } catch {
            setError(true);
            setStatus("Não foi possível iniciar o login Google. Tente novamente.");
            setLoginStarting(false);
        }
    }

    async function salvarAvaliacao(evento) {
        evento.preventDefault();
        setError(false);
        setStatus("");

        if (!user?.id || !supabase) {
            setError(true);
            setStatus("Entre com sua conta Google para publicar uma avaliação.");
            return;
        }

        const nome = accountName.trim();
        const nomeLength = Array.from(nome).length;
        const nota = Number(rating);
        const comentario = comment.trim();

        if (nomeLength < 2 || nomeLength > 254) {
            setError(true);
            setStatus("Não foi possível identificar um nome válido na sua conta Google.");
            return;
        }
        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            setError(true);
            setStatus("Escolha uma nota de 1 a 5 estrelas.");
            return;
        }
        if (EMAIL_PATTERN.test(comentario)) {
            setError(true);
            setStatus("Remova endereços de e-mail do comentário antes de publicar.");
            return;
        }
        if (!publicConsent) {
            setError(true);
            setStatus("Confirme que autoriza a publicação do nome, da nota e do comentário.");
            return;
        }

        setSaving(true);
        try {
            const { error: saveError } = await supabase
                .from("site_reviews")
                .upsert({
                    user_id: user.id,
                    display_name: nome,
                    rating: nota,
                    comment: comentario,
                    public_consent: true,
                }, { onConflict: "user_id" });
            if (saveError) throw saveError;

            setSaved(true);
            setPublicConsent(false);
            setConfirmDelete(false);
            setError(false);
            setStatus("Avaliação publicada para todos os visitantes. Para editar, entre com a mesma conta Google e confirme novamente a publicação.");
            notificarListaPublica();
        } catch {
            setError(true);
            setStatus("Não foi possível publicar a avaliação. Verifique a conexão e tente novamente.");
        } finally {
            setSaving(false);
        }
    }

    async function apagarAvaliacao() {
        if (!user?.id || !supabase) return;
        setSaving(true);
        setError(false);
        setStatus("");
        try {
            const { error: deleteError } = await supabase
                .from("site_reviews")
                .delete()
                .eq("user_id", user.id);
            if (deleteError) throw deleteError;

            setRating("");
            setComment("");
            setPublicConsent(false);
            setSaved(false);
            setConfirmDelete(false);
            setError(false);
            setStatus("Sua avaliação foi removida da lista pública.");
            notificarListaPublica();
        } catch {
            setError(true);
            setStatus("Não foi possível remover a avaliação. Tente novamente.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="site-review-entry" aria-labelledby="site-review-title">
            <div className="secao-heading">
                <span className="eyebrow">Sua opinião</span>
                <h2 id="site-review-title">Avalie o Riff Theory</h2>
                <p id="site-review-public-note">
                    As avaliações enviadas aqui ficam visíveis para todos. Publicamos o nome da sua conta Google ou, se ele não estiver disponível, o seu e-mail, além da nota e do comentário. A foto do Google nunca é publicada. Avaliações salvas anteriormente apenas neste navegador não serão publicadas automaticamente.
                </p>
            </div>

            {authLoading ? (
                <p className="site-review-status" role="status" aria-live="polite">Verificando sua sessão Google…</p>
            ) : !user ? (
                <div className="site-review-login">
                    <p>Entre com o Google para publicar e gerenciar sua avaliação. O nome da conta ou o e-mail será usado automaticamente como identificação pública; não há campo de nome editável.</p>
                    <button
                        className="site-review-submit site-review-login-button"
                        type="button"
                        onClick={iniciarLoginGoogle}
                        disabled={!authConfigured || loginStarting}
                    >
                        {loginStarting ? "Abrindo login Google…" : authConfigured ? "Entrar com Google para avaliar" : "Login Google indisponível neste ambiente"}
                    </button>
                    {authError && <p className="site-review-status is-error" role="status">{authError}</p>}
                    <p className={`site-review-status${status ? (error ? " is-error" : " is-success") : ""}`} role="status" aria-live="polite">{status}</p>
                </div>
            ) : (
                <form className="site-review-form" onSubmit={salvarAvaliacao}>
                    <fieldset disabled={loadingReview || saving} aria-describedby="site-review-public-note site-review-name-help site-review-status">
                        <legend>{saved ? "Sua avaliação pública" : "Deixe sua avaliação"}</legend>

                        <label className="site-review-label" htmlFor="site-review-name">Nome público</label>
                        <input
                            className="site-review-name"
                            id="site-review-name"
                            name="displayName"
                            type="text"
                            value={accountName}
                            readOnly
                            aria-readonly="true"
                            aria-describedby="site-review-name-help"
                            required
                        />
                        <span id="site-review-name-help" className="site-review-field-help">Este identificador vem da conta Google e não pode ser editado. Usamos o nome da conta; se ele não estiver disponível, usamos o e-mail.</span>

                        <span className="site-review-label">Sua nota</span>
                        <div className="site-review-rating" role="radiogroup" aria-label="Escolha uma nota de 1 a 5 estrelas" onMouseLeave={() => setHoverRating(0)}>
                            {ratingOptions.map((value) => (
                                <label
                                    className={`site-review-star${value <= (hoverRating || Number(rating)) ? " is-active" : ""}`}
                                    key={value}
                                    onMouseEnter={() => setHoverRating(value)}
                                >
                                    <input
                                        type="radio"
                                        name="site-rating"
                                        value={value}
                                        checked={Number(rating) === value}
                                        onChange={() => { setRating(value); setHoverRating(0); }}
                                        onFocus={() => setHoverRating(value)}
                                        onBlur={() => setHoverRating(0)}
                                        aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                                        required
                                    />
                                    <span aria-hidden="true">★</span>
                                </label>
                            ))}
                        </div>

                        <label className="site-review-label" htmlFor="site-review-comment">Comentário (opcional)</label>
                        <textarea
                            id="site-review-comment"
                            name="comment"
                            rows="3"
                            maxLength="500"
                            value={comment}
                            onChange={(evento) => setComment(evento.target.value)}
                            placeholder="O que você achou do site? Evite incluir dados pessoais."
                        />

                        <label className="site-review-consent" htmlFor="site-review-consent">
                            <input
                                id="site-review-consent"
                                name="publicConsent"
                                type="checkbox"
                                checked={publicConsent}
                                onChange={(evento) => setPublicConsent(evento.target.checked)}
                                required
                            />
                            <span>Autorizo a publicação do nome da minha conta Google ou e-mail, da nota e do comentário para todos os visitantes.</span>
                        </label>

                        <div className="site-review-actions">
                            <button className="site-review-submit" type="submit" disabled={loadingReview || saving}>
                                {saving ? "Salvando…" : saved ? "Atualizar avaliação pública" : "Publicar avaliação"}
                            </button>
                            {saved && !confirmDelete && (
                                <button className="site-review-clear" type="button" onClick={() => setConfirmDelete(true)} disabled={saving}>
                                    Remover avaliação pública
                                </button>
                            )}
                        </div>
                    </fieldset>

                    {loadingReview && <p className="site-review-status" role="status">Carregando sua avaliação…</p>}
                    {confirmDelete && (
                        <div className="site-review-delete-confirm" role="group" aria-labelledby="site-review-delete-title">
                            <p id="site-review-delete-title">Remover sua avaliação da lista pública? Isso não apaga nem altera sua conta Google.</p>
                            <div className="site-review-actions">
                                <button className="site-review-delete-confirm-button" type="button" onClick={apagarAvaliacao} disabled={saving}>
                                    {saving ? "Removendo…" : "Confirmar remoção"}
                                </button>
                                <button className="site-review-clear" type="button" onClick={() => setConfirmDelete(false)} disabled={saving}>Cancelar</button>
                            </div>
                        </div>
                    )}
                    <p
                        id="site-review-status"
                        className={`site-review-status${status ? (error ? " is-error" : " is-success") : ""}`}
                        role="status"
                        aria-live="polite"
                    >
                        {status}
                    </p>
                </form>
            )}
        </section>
    );
}
