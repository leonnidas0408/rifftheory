const reviews = [
    {
        author: "malu__2811",
        rating: 5,
        text: "Site fácil de navegar, com organização perfeita e transição clara entre os conteúdos. O ensino dos acordes é impecável, atendendo iniciantes e profissionais. Todos os recursos são gratuitos.",
    },
    {
        author: "ffernandocavalcante",
        rating: 5,
        text: "O site tem um design moderno, bonito e organizado, com uma interface intuitiva e fácil de navegar. Gostei da proposta de permitir que o usuário visualize os acordes diretamente no braço do instrumento e pratique de forma guiada. A trilha de quatro acordes é uma ideia interessante para facilitar o aprendizado, principalmente para iniciantes. Também achei muito positivo ter ferramentas como escalas, afinador e metrônomo reunidas no mesmo lugar. No geral, é uma plataforma muito promissora, prática e útil para quem deseja evoluir musicalmente. Como sugestão, seria interessante incluir mais exercícios interativos e um acompanhamento do progresso do aluno.",
    },
];

const ratingOptions = [5, 4, 3, 2, 1];
const averageRating = (
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
).toFixed(1).replace(".", ",");

function GoogleWordmark({ compact = false }) {
    return (
        <span className={`google-review-brand${compact ? " compact" : ""}`} aria-label="Google">
            {compact ? (
                <span className="google-mark-g">G</span>
            ) : (
                <>
                    <span className="google-letter google-letter-blue">G</span>
                    <span className="google-letter google-letter-red">o</span>
                    <span className="google-letter google-letter-yellow">o</span>
                    <span className="google-letter google-letter-blue">g</span>
                    <span className="google-letter google-letter-green">l</span>
                    <span className="google-letter google-letter-red">e</span>
                    <span className="google-review-brand-name">Reviews</span>
                </>
            )}
        </span>
    );
}

export default function ReviewsSection() {
    return (
        <section className="reviews-section google-reviews" aria-labelledby="reviews-title">
            <header className="google-reviews-heading">
                <div className="secao-heading">
                    <span className="eyebrow">Opiniões da comunidade</span>
                    <h2 id="reviews-title">Avaliações do Google</h2>
                    <p>Experiências de quem já conheceu o Riff Theory.</p>
                </div>
                <GoogleWordmark />
            </header>

            <div className="google-review-summary" aria-label={`Nota média ${averageRating} de 5, com ${reviews.length} avaliações`}>
                <strong className="google-review-score">{averageRating}</strong>
                <div className="google-review-summary-detail">
                    <span className="google-review-stars" aria-label="5 de 5 estrelas">★★★★★</span>
                    <span>{reviews.length} avaliações</span>
                </div>
            </div>

            <div className="google-review-grid" aria-label="Avaliações publicadas">
                {reviews.map((review) => (
                    <article className="google-review-card" key={review.author}>
                        <header className="google-review-person">
                            <span className="google-review-avatar" aria-hidden="true">
                                {review.author.slice(0, 1).toUpperCase()}
                            </span>
                            <div className="google-review-author">
                                <strong>{review.author}</strong>
                                <span className="google-review-stars" aria-label={`${review.rating} de 5 estrelas`}>
                                    {"★".repeat(review.rating)}
                                </span>
                            </div>
                            <GoogleWordmark compact />
                        </header>
                        <p className="google-review-text">{review.text}</p>
                    </article>
                ))}
            </div>

            <form className="site-review-form" aria-disabled="true">
                <fieldset disabled>
                    <legend>Deixe sua avaliação</legend>
                    <label className="site-review-label">Sua nota</label>
                    <div className="site-review-rating" role="group" aria-label="Escolha uma nota de 1 a 5 estrelas">
                        {ratingOptions.map((rating) => (
                            <label className="site-review-star" key={rating}>
                                <input type="radio" name="site-rating" value={rating} aria-label={`${rating} estrelas`} />
                                <span aria-hidden="true">★</span>
                            </label>
                        ))}
                    </div>
                    <label className="site-review-label" htmlFor="site-review-comment">Comentário</label>
                    <textarea
                        id="site-review-comment"
                        name="comment"
                        rows="3"
                        maxLength="500"
                        placeholder="O que você achou do site?"
                    />
                    <button className="site-review-submit" type="submit">Avaliar no Google</button>
                </fieldset>
                <p className="site-review-disabled-note" role="status">
                    O envio de novas avaliações está desativado enquanto o login com Google não estiver funcionando.
                </p>
            </form>
        </section>
    );
}
