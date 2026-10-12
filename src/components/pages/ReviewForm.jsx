const ratingOptions = [5, 4, 3, 2, 1];

export default function ReviewForm() {
    return (
        <section className="site-review-entry" aria-labelledby="site-review-title">
            <div className="secao-heading">
                <span className="eyebrow">Sua opinião</span>
                <h2 id="site-review-title">Avalie o Riff Theory</h2>
                <p>Este formulário é separado das avaliações já publicadas. O envio está desativado enquanto o login com Google não funciona.</p>
            </div>

            <form className="site-review-form" aria-disabled="true">
                <fieldset disabled aria-describedby="site-review-disabled-note">
                    <legend>Deixe sua avaliação</legend>
                    <span className="site-review-label">Sua nota</span>
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
                <p id="site-review-disabled-note" className="site-review-disabled-note" role="status">
                    Envio desativado; as avaliações já publicadas continuam visíveis no rodapé.
                </p>
            </form>
        </section>
    );
}
