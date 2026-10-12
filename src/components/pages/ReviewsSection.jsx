const ratingOptions = [5, 4, 3, 2, 1];

export default function ReviewsSection() {
    return (
        <section className="reviews-section" aria-labelledby="reviews-title">
            <div className="secao-heading">
                <span className="eyebrow">Sua opinião importa</span>
                <h2 id="reviews-title">Avaliações do Riff Theory</h2>
                <p>Veja as opiniões da comunidade e conte como foi sua experiência com o site.</p>
            </div>

            <div className="reviews-content">
                <aside className="reviews-summary" aria-label="Resumo das avaliações">
                    <span className="reviews-summary-label">Nota média</span>
                    <div className="reviews-score">
                        <strong>—</strong>
                        <span>/ 5</span>
                    </div>
                    <div className="reviews-stars" aria-hidden="true">☆☆☆☆☆</div>
                    <span className="reviews-count">0 avaliações publicadas</span>
                </aside>

                <div className="reviews-list" aria-live="polite" aria-label="Avaliações publicadas">
                    <span className="reviews-list-label">Opiniões da comunidade</span>
                    <div className="reviews-empty-state">
                        <span className="reviews-empty-mark" aria-hidden="true">☆</span>
                        <strong>Ainda não há avaliações publicadas</strong>
                        <p>As avaliações aparecerão aqui quando o envio for habilitado.</p>
                    </div>
                </div>
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
                    <button className="site-review-submit" type="submit">Enviar avaliação</button>
                </fieldset>
                <p className="site-review-disabled-note" role="status">
                    O envio está desativado até o login com Google estar funcionando.
                </p>
            </form>
        </section>
    );
}
