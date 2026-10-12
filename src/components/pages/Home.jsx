import { useEffect, useState } from "react";
import Barra from "../Barra";
import BracoInterativo from "../BracoInterativo";
import ChordSearch from "../Chord/ChordSearch";
import ReviewForm from "./ReviewForm";
import ReviewsDisplay from "./ReviewsDisplay";
import { registrarEvento } from "../../utils/usageStats";
import FAQQuestion from "../FAQQuestion";

function rolarPara(id) {
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

export default function Home({ setPage }) {
    const EXEMPLOS_USO = [
        {
            nicho: "Quem está começando",
            antes: "Você sabe o nome do acorde, mas trava na hora de encontrar a forma.",
            depois: "Escolha um acorde e veja sua posição no braço imediatamente, sem sair da prática.",
        },
        {
            nicho: "Quem está montando repertório",
            antes: "Você alterna entre cifra, diagrama e vídeo para lembrar cada troca.",
            depois: "Use uma trilha pronta de acordes para revisar as trocas em sequência no mesmo app.",
        },
        {
            nicho: "Quem quer entender teoria",
            antes: "A escala parece uma lista de notas sem ligação com o que você toca.",
            depois: "Explore a escala, veja os acordes do campo harmônico e teste as formas no braço.",
        },
    ];
    // Progressões para treinar sem digitar nada (cada uma vira uma trilha de acordes).
    const PROGRESSOES = [
        ["C", "G", "Am", "F"],
        ["Em", "C", "G", "D"],
        ["Am", "F", "C", "G"],
    ];
    const [trilha, setTrilha] = useState(null);
    const [abrirEscolha, setAbrirEscolha] = useState(0);

    useEffect(() => {
        const blocos = Array.from(document.querySelectorAll(
            ".pagina > section, .pagina > .comecar, .pagina > #secao-braco"
        ));
        if (!blocos.length) return undefined;

        const movimentoReduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (movimentoReduzido || !("IntersectionObserver" in window)) {
            blocos.forEach((bloco) => bloco.classList.add("scroll-reveal", "is-visible"));
            return undefined;
        }

        blocos.forEach((bloco) => bloco.classList.add("scroll-reveal"));
        const observer = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                entrada.target.classList.toggle("is-visible", entrada.isIntersecting);
            });
        }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });

        blocos.forEach((bloco) => observer.observe(bloco));
        return () => observer.disconnect();
    }, []);

    function focarBusca() {
        rolarPara("comecar");
        document.getElementById("busca-cifra")?.focus({ preventScroll: true });
    }

    function abrirAcordes() {
        setAbrirEscolha((v) => v + 1);
        rolarPara("secao-braco");
    }

    function iniciarTrilha(acordes) {
        setTrilha({ acordes, k: Date.now() });
        rolarPara("secao-braco");
    }

    function retomar(acorde) {
        registrarEvento("return_session_opened", { acorde });
        iniciarTrilha([acorde]);
    }

    return (
        <div className="pagina">
            <Barra titulo="Início"/>
            <section className="tab-hero">
                <div className="hero-kicker">Acordes, braço interativo e prática guiada</div>
                <h1>Escolha um acorde. Veja a posição no braço e comece a tocar.</h1>
                <p>
                    No primeiro clique, abra uma trilha de 4 acordes e veja a primeira forma no braço.
                    Depois, avance acorde por acorde — sem alternar entre ferramentas.
                </p>
                <div className="hero-acoes">
                    <button
                        className="link-botao hero-cta"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "pratica_guiada" });
                            iniciarTrilha(PROGRESSOES[0]);
                        }}
                    >
                        Testar trilha de 4 acordes
                    </button>
                    <button
                        className="hero-secundaria"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "acordes" });
                            abrirAcordes();
                        }}
                    >
                        Ver acordes no braço
                    </button>
                </div>
                <div className="hero-seguranca">
                    <span className="seguranca-icone" aria-hidden="true">✓</span>
                    <span>Gratuito para experimentar · sem cartão · sem cadastro para a prática guiada.</span>
                </div>
            </section>

            <section className="prova-valor" aria-label="Por que usar o Riff Theory">
                <div className="prova-intro">
                    <span className="eyebrow">A diferença está no próximo clique</span>
                    <h2>Menos procura. Mais tempo tocando.</h2>
                    <p>Em vez de abrir uma busca, um diagrama e um metrônomo separados, você escolhe um acorde e já tem uma próxima ação dentro do app.</p>
                </div>
                <div className="prova-numeros">
                    <div className="prova-numero"><strong>1 clique</strong><span>para revelar a forma de um acorde no braço</span></div>
                    <div className="prova-numero"><strong>4 acordes</strong><span>em cada trilha guiada pronta para tocar</span></div>
                    <div className="prova-numero"><strong>20–400</strong><span>BPM no metrônomo para praticar no seu ritmo</span></div>
                </div>
                <div className="prova-recursos">
                    <div><strong>1. Escolha</strong><span>Comece com uma trilha ou acorde pronto.</span></div>
                    <div><strong>2. Veja</strong><span>A forma aparece no braço interativo.</span></div>
                    <div><strong>3. Toque</strong><span>Avance para o próximo acorde sem trocar de ferramenta.</span></div>
                </div>
                <div className="comparacao"><strong>Alternativa comum:</strong> buscar → abrir abas → copiar o acorde. <strong>No Riff Theory:</strong> escolher → visualizar → tocar.</div>
                <div className="prova-credibilidade"><span><strong>Confira no próprio app:</strong> o botão “Testar trilha de 4 acordes” abre uma sequência no braço interativo; não é necessário criar conta para testar a prática.</span></div>
                <div className="trust-grid" aria-label="Sinais de confiança">
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Sem cartão para testar</strong><span>A prática guiada e o braço interativo podem ser explorados sem cadastro.</span></div></div>
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Progresso no navegador</strong><span>Histórico e dados de prática ficam no dispositivo; não são enviados para uma conta.</span></div></div>
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Transparência no Chatbot</strong><span>O Thonic exige login Google. Ao enviar uma pergunta, ela e o histórico recente são enviados ao serviço de IA para gerar a resposta.</span></div></div>
                </div>
            </section>

            <section className="objecoes" aria-labelledby="titulo-objecoes">
                <div className="secao-heading">
                    <span className="eyebrow">Antes de começar</span>
                    <h2 id="titulo-objecoes">Feito para testar sem compromisso</h2>
                </div>
                <div className="objecoes-grid">
                    <div><strong>Preço</strong><span><b>Gratuito para experimentar.</b> A prática guiada não exige cadastro; o Chatbot exige login Google. Limites de uso se aplicam ao assistente.</span></div>
                    <div><strong>Setup</strong><span><b>Abra e toque.</b> Funciona no navegador, sem instalar programa ou configurar conta.</span></div>
                    <div><strong>Dados</strong><span><b>Prática e progresso ficam no navegador.</b> Perguntas e histórico recente só são enviados quando você usa o Chatbot.</span></div>
                    <div><strong>Troca de ferramenta</strong><span><b>Prática guiada dentro do app.</b> Use a busca apenas quando quiser partir de uma música.</span></div>
                </div>
            </section>

            <section className="rotas-pratica" aria-labelledby="titulo-rotas-pratica">
                <div className="secao-heading">
                    <span className="eyebrow">Comece simples</span>
                    <h2 id="titulo-rotas-pratica">Escolha uma prática e avance no seu ritmo</h2>
                    <p>Você não precisa estudar tudo de uma vez. Comece por uma ação concreta e aprofunde quando fizer sentido.</p>
                </div>
                <div className="rotas-grade">
                    <article className="rota-card">
                        <span className="rota-numero">01</span>
                        <strong>Aprender um acorde</strong>
                        <p>Veja a forma no braço e descubra onde colocar cada dedo.</p>
                        <button className="pilula" onClick={abrirAcordes}>Ver acordes práticos</button>
                    </article>
                    <article className="rota-card">
                        <span className="rota-numero">02</span>
                        <strong>Treinar uma troca</strong>
                        <p>Pratique uma progressão pronta com quatro acordes em sequência.</p>
                        <button className="pilula" onClick={() => iniciarTrilha(PROGRESSOES[0])}>Iniciar uma trilha</button>
                    </article>
                    <article className="rota-card">
                        <span className="rota-numero">03</span>
                        <strong>Entender a relação</strong>
                        <p>Explore a escala e veja como ela se conecta aos acordes que você toca.</p>
                        <button className="pilula" onClick={() => setPage?.("Escalas")}>Explorar escalas</button>
                    </article>
                </div>
            </section>

            <section className="exemplos-uso" aria-labelledby="titulo-exemplos">
                <div className="secao-heading">
                    <span className="eyebrow">Antes e depois</span>
                    <h2 id="titulo-exemplos">Veja como o fluxo muda a prática</h2>
                    <p>Sem depoimentos ou resultados de usuários inventados: confira cada etapa diretamente no app antes de decidir se funciona para sua prática.</p>
                </div>
                <div className="exemplos-grade">
                    {EXEMPLOS_USO.map((exemplo) => (
                        <article className="exemplo-card" key={exemplo.nicho}>
                            <strong>{exemplo.nicho}</strong>
                            <div><span className="exemplo-label">Antes</span><p>{exemplo.antes}</p></div>
                            <div><span className="exemplo-label depois">Depois</span><p>{exemplo.depois}</p></div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="beta-convite" aria-label="Convite para testar e enviar feedback">
                <div>
                    <span className="eyebrow">Produto em evolução</span>
                    <h2>Teste tocando uma música real</h2>
                    <p>O melhor feedback vem de quem usa o instrumento. Se uma etapa ficar confusa ou faltar um acorde, anote o caso concreto para a próxima rodada de melhorias.</p>
                </div>
            </section>

            <div id="comecar" className="comecar">
                <div className="comecar-topo">
                    <h2>Escolha um ponto de partida</h2>
                    <span className="subtitulo">Você pode mudar de caminho a qualquer momento.</span>
                    <div className="braco-acoes">
                        <button className="pilula ligada" onClick={focarBusca}>
                            Buscar uma música
                        </button>
                        <button className="pilula" onClick={abrirAcordes}>
                            Ver acordes no braço
                        </button>
                        <button className="pilula" onClick={() => setPage?.("Escalas")}>
                            Explorar escalas
                        </button>
                    </div>
                    <p className="cta-seguranca"><strong>Comece agora:</strong> escolha uma trilha e veja o primeiro acorde no braço — ou busque uma música quando já souber o que quer tocar.</p>
                </div>

                <ChordSearch setPage={setPage} />

                <div className="sugestoes">
                    <span className="subtitulo">Ou treine uma progressão no braço:</span>
                    {PROGRESSOES.map((acordes) => (
                        <button
                            key={acordes.join("-")}
                            className="pilula"
                            onClick={() => iniciarTrilha(acordes)}
                        >
                            {acordes.join(" – ")}
                        </button>
                    ))}
                </div>
            </div>

            <div id="secao-braco">
                <BracoInterativo
                    guiado
                    acordeInicial="C"
                    iniciarTrilha={trilha}
                    abrirEscolha={abrirEscolha}
                    onVerEscalas={() => setPage?.("Escalas")}
                />
            </div>
            <div className="mobile-cta-wrap">
                <button className="mobile-cta" onClick={() => {
                    registrarEvento("mobile_cta_clicked", { cta: "pratica_guiada" });
                    iniciarTrilha(PROGRESSOES[0]);
                }}>
                    <span>Trilha guiada · 4 acordes</span>
                    <strong>Experimentar</strong>
                </button>
            </div>
            <ReviewForm />
            <footer className="reviews-footer">
                <ReviewsDisplay />
            </footer>
            <h1>FAQ</h1>
            <div>
                <span className="light-description">Nesse FAQ, RT serve como uma abreviação de Riff Theory.</span>
                <FAQQuestion
                    question="Para usar o RT, precisa de cadastro?"
                    answer="O cadastro é necessário somente para o plano premium e para usar o Thonic, nosso assistente de IA."
                />
                <FAQQuestion
                    question="O que fica salvo no RT?"
                    answer="Na nuvem, apenas sua conta fica salva. Localmente, ficam seus dados de uso e eles nunca são enviados."
                />
                <FAQQuestion
                    question="Para que serve o chatbot?"
                    answer="O nosso chatbot, o Thonic, serve para responder perguntas relacionadas a teoria musical. Na verdade, como ele foi feito pensando exatamente nisso, ele acabou sendo melhor do que outras IAs para responder perguntas desse tipo."
                />
                <FAQQuestion
                    question="O RT funciona no celular?"
                    answer="Sim! O Riff Theory tem compatibilidade total ao celular."
                />
                <FAQQuestion
                    question="O RT é para violão ou guitarra?"
                    answer="O Riff Theory serve para os 2!"
                />
            </div>
        </div>
    )
}
