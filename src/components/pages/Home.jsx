import { useEffect, useState } from "react";
import Barra from "../Barra";
import BracoInterativo from "../BracoInterativo";
import ChordSearch from "../Chord/ChordSearch";
import ReviewForm from "./ReviewForm";
import ReviewsDisplay from "./ReviewsDisplay";
import { registrarEvento } from "../../utils/usageStats";
import FAQQuestion from "../FAQQuestion";
import Markdown from "react-markdown";
import { AccessConsentInline } from "../AccessConsent";

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
    const [resumoAvaliacoes, setResumoAvaliacoes] = useState(null);
    const [mostrarCtaFixa, setMostrarCtaFixa] = useState(false);

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

    useEffect(() => {
        const cta = document.getElementById("hero-cta");
        if (!cta || !("IntersectionObserver" in window)) return undefined;

        const observer = new IntersectionObserver(([entrada]) => {
            setMostrarCtaFixa(!entrada.isIntersecting && entrada.boundingClientRect.bottom <= 0);
        }, { threshold: 0 });
        observer.observe(cta);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const secaoConfianca = document.querySelector(".trust-section");
        if (!secaoConfianca || !("IntersectionObserver" in window)) return undefined;

        const observer = new IntersectionObserver(([entrada]) => {
            document.body.classList.toggle("home-trust-visible", entrada.isIntersecting);
        }, { threshold: 0.05 });
        observer.observe(secaoConfianca);
        return () => {
            observer.disconnect();
            document.body.classList.remove("home-trust-visible");
        };
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
                <picture className="tab-hero-art" aria-hidden="true">
                    <source media="(max-width: 560px)" srcSet="/hero-portrait.webp" />
                    <source media="(max-width: 900px)" srcSet="/hero-square.webp" />
                    <img src="/hero-wide.webp" alt="" width="2560" height="1440" fetchPriority="high" decoding="async" />
                </picture>
                <div className="hero-kicker">Acordes, braço interativo e prática guiada</div>
                <h1>Toque uma trilha. Veja cada acorde no braço.</h1>
                <p>
                    No primeiro clique, abra uma trilha de 4 acordes: veja cada forma no braço e avance no seu ritmo.
                </p>
                <div className="hero-acoes">
                    <button
                        className="link-botao hero-cta"
                        id="hero-cta"
                        type="button"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "pratica_guiada" });
                            iniciarTrilha(PROGRESSOES[0]);
                        }}
                    >
                        Testar trilha de 4 acordes
                    </button>
                    <a
                        className="hero-secundaria"
                        href="#comecar"
                    >
                        Explorar outras opções
                    </a>
                </div>
                <div className="hero-first-step-preview" aria-label="Prévia da trilha inicial: C, G, Am e F">
                    <span>Primeira trilha</span>
                    <strong>C <i aria-hidden="true">→</i> G <i aria-hidden="true">→</i> Am <i aria-hidden="true">→</i> F</strong>
                    <span>cada forma aparece no braço, uma por vez</span>
                </div>
                <div className="hero-seguranca">
                    <span className="seguranca-icone" aria-hidden="true">✓</span>
                    <span>Grátis para experimentar, sem conta nem cartão. A trilha aparece no braço interativo; avance acorde a acorde e use o metrônomo.</span>
                </div>
                {resumoAvaliacoes?.count > 0 && (
                    <a className="trust-review-summary hero-review-summary" href="#reviews" aria-label={`Ver ${resumoAvaliacoes.count} avaliações públicas; nota ${resumoAvaliacoes.average} de 5`}>
                        <span aria-hidden="true">★</span>
                        <strong>{resumoAvaliacoes.average}</strong> de 5
                        <span>· {resumoAvaliacoes.count} avaliações públicas · ver relatos</span>
                    </a>
                )}
            </section>

            <section className="trust-section" aria-labelledby="trust-title">
                <div className="trust-section-heading">
                    <span className="eyebrow">Transparência antes de começar</span>
                    <h2 id="trust-title">Pratique sem conta. Escolha quando entrar.</h2>
                    <p>A prática guiada funciona sem login. O Google só é solicitado se você escolher recursos que precisam de conta.</p>
                </div>
                <div className="trust-grid" aria-label="Resumo de acesso e privacidade">
                    <div className="trust-item">
                        <span className="trust-check" aria-hidden="true">✓</span>
                        <div><strong>Prática sem cadastro</strong><span>Teste uma trilha gratuita de 4 acordes, sem conta nem cartão.</span></div>
                    </div>
                    <div className="trust-item">
                        <span className="trust-check" aria-hidden="true">✓</span>
                        <div><strong>Dados no navegador</strong><span>Histórico e progresso de prática ficam armazenados neste dispositivo.</span></div>
                    </div>
                    <div className="trust-item">
                        <span className="trust-check" aria-hidden="true">i</span>
                        <div><strong>Google só nos recursos opcionais</strong><span>Login para usar o Thonic, publicar uma avaliação ou acessar recursos premium; não é necessário para praticar.</span></div>
                    </div>
                </div>
                <p className="trust-review-note"><strong>Avaliação pública:</strong> só após login e consentimento explícito, o nome da conta Google (ou e-mail, se o nome não estiver disponível), a nota e o comentário ficam visíveis para todos.</p>
                <details className="trust-details">
                    <summary>Saiba mais sobre dados e privacidade</summary>
                    <div className="trust-details-copy">
                        <p><strong>Prática guiada:</strong> métricas e histórico de prática são guardados no armazenamento local deste navegador; não são associados à conta do Thonic.</p>
                        <p><strong>Thonic:</strong> exige login Google. Quando você envia uma pergunta, ela e o contexto recente da conversa são enviados ao provedor de IA; a conversa fica salva na sua conta para você continuar depois.</p>
                        <p><strong>Contagem de acessos:</strong> só é ativada se você permitir no aviso de privacidade. Recusar não bloqueia a prática; você pode mudar a escolha em “Privacidade e acessos”.</p>
                    </div>
                </details>
                <AccessConsentInline />
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
            </section>

            <section className="objecoes" aria-labelledby="titulo-objecoes">
                <div className="secao-heading">
                    <span className="eyebrow">Antes de começar</span>
                    <h2 id="titulo-objecoes">Feito para testar sem compromisso</h2>
                </div>
                <div className="objecoes-grid">
                    <div><strong>Preço e acesso</strong><span><b>A trilha guiada é gratuita para experimentar, sem cartão ou conta.</b> Recursos premium são opcionais; login Google só aparece quando você escolhe um recurso que exige conta. Limites de uso se aplicam ao Thonic.</span></div>
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
            <div className={`mobile-cta-wrap${mostrarCtaFixa ? " is-visible" : ""}`} aria-hidden={!mostrarCtaFixa}>
                <button className="mobile-cta" tabIndex={mostrarCtaFixa ? 0 : -1} type="button" onClick={() => {
                    registrarEvento("mobile_cta_clicked", { cta: "pratica_guiada" });
                    iniciarTrilha(PROGRESSOES[0]);
                }}>
                    <span>Trilha guiada · 4 acordes</span>
                    <strong>Experimentar</strong>
                </button>
            </div>
            <ReviewForm />
            <footer className="reviews-footer">
                <ReviewsDisplay onSummaryChange={setResumoAvaliacoes} />
            </footer>
            <h1>FAQ</h1>
            <div className="faq-list">
                <span className="light-description">Nesse FAQ, RT serve como uma abreviação de Riff Theory.</span>
                <FAQQuestion
                    question="Para usar o RT, precisa de cadastro?"
                    answer="Não para praticar ou testar a trilha guiada. O login Google só é solicitado se você escolher o Thonic, publicar uma avaliação pública ou acessar recursos premium."
                />
                <FAQQuestion
                    question="O que fica salvo no RT?"
                    answer="O histórico e o progresso da prática ficam no armazenamento local deste navegador. A contagem anônima de acessos só é ativada se você consentir. Ao usar o Thonic, a pergunta e o contexto recente são enviados ao serviço de IA e a conversa fica salva na sua conta."
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
                <p className="simple-margin-top">Na dúvida, não fique se remoendo para achar a resposta! Nosso e-mail de suporte e feedback é <strong>rifftheory6@gmail.com</strong></p>
            </div>
        </div>
    )
}
