import { useEffect, useState } from "react";
import { supabase } from "../../auth/supabase";
import Markdown from "react-markdown";

const REVIEW_UPDATED_EVENT = "riff:site-reviews-changed";

// Avaliações já publicadas no site antes da integração. Mantidas sem inventar dados.
const existingReviews = [
    {
        id: "existing-malu-2811",
        author: "malu__2811",
        rating: 5,
        date: "12 de out. de 2026, 10:54",
        text: "Site **fácil de navegar**, com **organização perfeita e transição clara** entre os conteúdos. O ensino dos acordes é **impecável**, atendendo iniciantes e profissionais. Todos os recursos são gratuitos.",
    },
    {
        id: "existing-ffernando-cavalcante",
        author: "ffernandocavalcante",
        rating: 5,
        date: "12 de out. de 2026, 11:07",
        text: "O site tem um **design moderno, bonito e organizado**, com uma interface **intuitiva** e **fácil de navegar**. **Gostei** da proposta de permitir que o usuário visualize os acordes diretamente no braço do instrumento e pratique de forma guiada. A trilha de quatro acordes é uma **ideia interessante** para facilitar o aprendizado, principalmente para iniciantes. Também **achei muito positivo** ter ferramentas como escalas, afinador e metrônomo reunidas no mesmo lugar. No geral, é uma plataforma muito **promissora, prática e útil** para quem deseja evoluir musicalmente. Como sugestão, seria interessante incluir mais exercícios interativos e um acompanhamento do progresso do aluno.",
    },
    {
        id: "existing-luis-m-012",
        author: "luis_m.012",
        rating: 5,
        date: "12 de out. de 2026, 15:48",
        text: "O site é **muito bem organizado** e **fácil de usar**, com uma **proposta interessante** para quem gosta de guitarra e música. A navegação é **intuitiva**, e dá pra perceber o cuidado colocado no desenvolvimento do projeto. Uma **ótima iniciativa**, principalmente para quem procura conteúdo relacionado ao mundo da guitarra. **Recomendo!**",
    },
];

function formatarData(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

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
                const { data, error } = await supabase
                    .from("site_reviews_public")
                    .select("id, display_name, rating, comment, created_at")
                    .order("created_at", { ascending: false })
                    .limit(100);
                if (error) throw error;
                if (!active) return;

                const validReviews = (Array.isArray(data) ? data : [])
                    .filter((review) => (
                        typeof review.id === "string"
                        && typeof review.display_name === "string"
                        && Number.isInteger(Number(review.rating))
                        && Number(review.rating) >= 1
                        && Number(review.rating) <= 5
                    ))
                    .map((review) => ({
                        id: `community-${review.id}`,
                        author: review.display_name.trim(),
                        rating: Number(review.rating),
                        text: typeof review.comment === "string" ? review.comment : "",
                        date: formatarData(review.created_at),
                    }));

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
