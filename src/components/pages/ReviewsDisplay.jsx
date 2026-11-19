import { useEffect, useState } from "react";
import { supabase } from "../../auth/supabase";
import Markdown from "react-markdown";
import {
    REVIEW_UPDATED_EVENT,
    carregarAvaliacoesComunitarias,
    existingReviews,
} from "./reviewsData";

export default function ReviewsDisplay() {
    const [communityReviews, setCommunityReviews] = useState([]);
    const [loading, setLoading] = useState(Boolean(supabase));
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let active = true;

        async function carregarAvaliacoes() {
            if (!supabase) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const validReviews = await carregarAvaliacoesComunitarias(supabase);
                if (!active) return;

                setCommunityReviews(validReviews);
                setLoadError(false);
            } catch {
                if (!active) return;
                setCommunityReviews([]);
                setLoadError(true);
            } finally {
                if (active) setLoading(false);
            }
        }

        carregarAvaliacoes();
        window.addEventListener(REVIEW_UPDATED_EVENT, carregarAvaliacoes);
        return () => {
            active = false;
            window.removeEventListener(REVIEW_UPDATED_EVENT, carregarAvaliacoes);
        };
    }, []);

    const reviews = [...communityReviews, ...existingReviews];
    const score = reviews.length
        ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
        : null;
    const averageRating = score === null ? "—" : score.toFixed(1).replace(".", ",");
    const summaryStars = score === null ? 0 : Math.round(score);

    return (
        <section className="reviews-section google-reviews" aria-labelledby="reviews-title" aria-busy={loading}>
            <header className="google-reviews-heading">
                <div className="secao-heading">
                    <span className="eyebrow">Opiniões da comunidade</span>
                    <h2 id="reviews-title">Avaliações</h2>
                    <p>Experiências de quem já conheceu o Riff Theory.</p>
                </div>
            </header>

            <div className="google-review-summary" aria-label={`Nota média ${averageRating} de 5, com ${reviews.length} avaliações`}>
                <strong className="google-review-score">{averageRating}</strong>
                <div className="google-review-summary-detail">
                    <span className="google-review-stars" aria-label={`${summaryStars} de 5 estrelas`}>
                        {"★".repeat(summaryStars)}{"☆".repeat(5 - summaryStars)}
                    </span>
                    <span>{reviews.length} avaliações</span>
                </div>
            </div>

            {loading && <p className="google-review-status" role="status">Carregando avaliações públicas…</p>}
            {loadError && (
                <p className="google-review-status is-error" role="status">
                    As novas avaliações da comunidade não puderam ser carregadas agora. As avaliações já publicadas continuam visíveis.
                </p>
            )}

            <div className="google-review-grid" aria-label="Avaliações publicadas">
                {reviews.map((review) => (
                    <article className="google-review-card" key={review.id}>
                        <header className="google-review-person">
                            <span className="google-review-avatar" aria-hidden="true">
                                {review.author.slice(0, 1).toUpperCase()}
                            </span>
                            <div className="google-review-author">
                                <strong>{review.author}</strong>
                                {review.date && <time className="google-review-date">{review.date}</time>}
                                <span className="google-review-stars" aria-label={`${review.rating} de 5 estrelas`}>
                                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                </span>
                            </div>
                        </header>
                        <Markdown>{review.text || "Avaliação sem comentário escrito."}</Markdown>
                    </article>
                ))}
            </div>
        </section>
    );
}
