export const REVIEW_UPDATED_EVENT = "riff:site-reviews-changed";

// Avaliações publicadas antes da integração. Mantidas sem inventar dados.
export const existingReviews = [
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

export function formatarData(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function avaliacaoPublicaValida(review) {
    const comentario = typeof review?.comment === "string" ? review.comment.trim() : "";
    if (!comentario) return true;

    const normalizado = comentario
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const nomeDoResponsavel = /\b(?:leonnidas|leonidas|leonid)\b/;
    if (nomeDoResponsavel.test(normalizado)) return false;

    const sinaisDeMaFe = [
        /so\s+porque\s+(?:e|foi)\s+(?:voce|seu|sua)/,
        /por\s+ser\s+(?:voce|meu\s+amigo|minha\s+amiga)/,
        /por\s+causa\s+do\s+dono/,
        /avali(?:ei|ar)\s+(?:mal|negativo|negativamente)\s+de\s+proposito/,
        /site\s+ruim\s+porque\s+(?:e|foi)\s+(?:dele|dela|seu|sua)/,
    ];
    if (sinaisDeMaFe.some((padrao) => padrao.test(normalizado))) return false;

    const ataquePessoalAoResponsavel = /\b(?:dono|criador|desenvolvedor)\b.{0,30}\b(?:burro|imbecil|incompetente|idiota|fracassado)\b/;
    return !ataquePessoalAoResponsavel.test(normalizado);
}

export async function carregarAvaliacoesComunitarias(client) {
    if (!client) return [];

    const { data, error } = await client
        .from("site_reviews_public")
        .select("id, display_name, rating, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) throw error;

    return (Array.isArray(data) ? data : [])
        .filter((review) => (
            typeof review.id === "string"
            && typeof review.display_name === "string"
            && Number.isInteger(Number(review.rating))
            && Number(review.rating) >= 1
            && Number(review.rating) <= 5
        ))
        .filter(avaliacaoPublicaValida)
        .map((review) => ({
            id: `community-${review.id}`,
            author: review.display_name.trim(),
            rating: Number(review.rating),
            text: typeof review.comment === "string" ? review.comment : "",
            date: formatarData(review.created_at),
        }));
}

export function resumirAvaliacoes(reviews) {
    const count = reviews.length;
    const score = count
        ? reviews.reduce((total, review) => total + review.rating, 0) / count
        : null;
    return {
        count,
        score: score === null ? "—" : score.toFixed(1).replace(".", ","),
        stars: score === null ? 0 : Math.round(score),
    };
}
