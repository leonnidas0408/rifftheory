import { useState } from "react";

const STORAGE_KEY = "riff-theory:local-review:v1";
const ratingOptions = [1, 2, 3, 4, 5];

function lerAvaliacaoLocal() {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const valor = JSON.parse(raw);
        const rating = Number(valor?.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;

        return {
            rating,
            comment: typeof valor.comment === "string" ? valor.comment.slice(0, 500) : "",
        };
    } catch {
        return null;
    }
}

export default function ReviewForm() {
    const [avaliacaoAnterior] = useState(() => lerAvaliacaoLocal());
    const [rating, setRating] = useState(() => avaliacaoAnterior?.rating || "");
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(() => avaliacaoAnterior?.comment || "");
    const [salva, setSalva] = useState(Boolean(avaliacaoAnterior));
    const [status, setStatus] = useState("");
    const [erro, setErro] = useState(false);

    function salvarAvaliacao(evento) {
        evento.preventDefault();
        const nota = Number(rating);

        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            setErro(true);
            setStatus("Escolha uma nota de 1 a 5 estrelas.");
            return;
        }

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                rating: nota,
                comment: comment.trim(),
                savedAt: new Date().toISOString(),
            }));
            setSalva(true);
            setErro(false);
            setStatus("Avaliação salva somente neste navegador. Ela não foi enviada ao Riff Theory.");
        } catch {
            setErro(true);
            setStatus("Não foi possível salvar neste navegador. Verifique as permissões de armazenamento e tente novamente.");
        }
    }

    function apagarAvaliacao() {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
            setRating("");
            setComment("");
            setSalva(false);
            setErro(false);
            setStatus("Avaliação apagada deste navegador.");
        } catch {
            setErro(true);
            setStatus("Não foi possível apagar a avaliação deste navegador.");
        }
    }

    return (
        <section className="site-review-entry" aria-labelledby="site-review-title">
            <div className="secao-heading">
                <span className="eyebrow">Sua opinião</span>
                <h2 id="site-review-title">Avalie o Riff Theory</h2>
                <p>Registre uma nota para consultar neste dispositivo. A avaliação não é enviada ao site nem aparece como avaliação pública.</p>
            </div>

            <form className="site-review-form" onSubmit={salvarAvaliacao}>
                <fieldset aria-describedby="site-review-local-note site-review-status">
                    <legend>Deixe sua avaliação</legend>
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
                    <div className="site-review-actions">
                        <button className="site-review-submit" type="submit">Salvar avaliação</button>
                        {salva && (
                            <button className="site-review-clear" type="button" onClick={apagarAvaliacao}>
                                Apagar avaliação local
                            </button>
                        )}
                    </div>
                </fieldset>
                <p id="site-review-local-note" className="site-review-local-note">
                    Armazenamento local neste navegador; nada é enviado ao servidor. Limpar os dados do navegador também remove esta avaliação.
                </p>
                <p
                    id="site-review-status"
                    className={`site-review-status${status ? (erro ? " is-error" : " is-success") : ""}`}
                    role="status"
                    aria-live="polite"
                >
                    {status}
                </p>
            </form>
        </section>
    );
}
