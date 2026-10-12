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
    {
        author: "luis_m.012",
        rating: 5,
        text: "O site é muito bem organizado e fácil de usar, com uma proposta interessante para quem gosta de guitarra e música. A navegação é intuitiva, e dá pra perceber o cuidado colocado no desenvolvimento do projeto. Uma ótima iniciativa, principalmente para quem procura conteúdo relacionado ao mundo da guitarra. Recomendo!",
    },
];

const averageRating = (
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
).toFixed(1).replace(".", ",");

export default function ReviewsDisplay() {
    return (
        <section className="reviews-section google-reviews" aria-labelledby="reviews-title">
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
                        </header>
                        <p className="google-review-text">{review.text}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
