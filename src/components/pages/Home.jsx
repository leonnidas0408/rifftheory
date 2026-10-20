import { useEffect, useState } from "react";
import Barra from "../Barra";
import BracoInterativo from "../BracoInterativo";
import ChordSearch from "../Chord/ChordSearch";
import ReviewForm from "./ReviewForm";
import ReviewsDisplay from "./ReviewsDisplay";
import { registrarEvento } from "../../utils/usageStats";
import FAQQuestion from "../FAQQuestion";
import Markdown from "react-markdown";

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
                <picture className="tab-hero-art" aria-hidden="true">
                    <source media="(max-width: 560px)" srcSet="/hero-portrait.webp" />
                    <source media="(max-width: 900px)" srcSet="/hero-square.webp" />
                    <img src="/hero-wide.webp" alt="Braço de guitarra com uma trilha de acordes para praticar" title="Prática guiada de acordes no Riff Theory" width="1920" height="1080" fetchPriority="high" decoding="async" />
                </picture>
                <div className="hero-kicker">Acordes, braço interativo e prática guiada</div>
                <h1>Escolha um acorde. Veja a posição no braço e comece a tocar.</h1>
                <p>
                    Em cerca de 1 minuto, abra uma trilha de 4 acordes e veja onde colocar os dedos no braço interativo.
                    Depois, avance acorde por acorde com as próximas ferramentas sempre a um clique de distância.
                </p>
                <div className="hero-demo hero-demo-compact" aria-label="Prévia do que aparece ao testar a trilha">
                    <div className="hero-demo-topline">
                        <span>Você verá no primeiro clique</span>
                        <strong>01 de 04 · Dó maior</strong>
                    </div>
                    <div className="hero-demo-progression" aria-label="Trilha C, G, Am e F">
                        {PROGRESSOES[0].map((acorde, index) => (
                            <span className={index === 0 ? "is-active" : ""} key={acorde}>{acorde}</span>
                        ))}
                    </div>
                    <div className="hero-demo-neck" aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5].map((corda) => (
                            <span className="hero-demo-string" key={corda}>
                                <i className={`hero-demo-note note-${corda}`} />
                            </span>
                        ))}
                    </div>
                    <span className="hero-demo-hint">O braço mostra onde colocar os dedos.</span>
                </div>
                <div className="hero-acoes">
                    <button
                        className="link-botao hero-cta"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "pratica_guiada" });
                            iniciarTrilha(PROGRESSOES[0]);
                        }}
                    >
                        Testar trilha no braço
                    </button>
                    <button
                        className="hero-secundaria"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "acordes" });
                            abrirAcordes();
                        }}
                    >
                        Escolher um acorde
                    </button>
                </div>
                <p className="hero-cta-note">Abre uma sequência de 4 acordes e mostra a 1ª forma — sem conta, sem cartão.</p>
                <div className="hero-social-proof" aria-label="Prova social do Riff Theory">
                    <span className="hero-social-stars" aria-hidden="true">★★★★★</span>
                    <div>
                        <strong>5,0/5 · 6 avaliações públicas</strong>
                        <span>“Fácil de navegar e com transição clara.” · “Muito bem organizado e fácil de usar.”</span>
                        <small>Fonte: avaliações públicas do próprio site · iniciantes, navegação e prática guiada.</small>
                    </div>
                    <button type="button" onClick={() => rolarPara("reviews-title")}>Ler avaliações</button>
                </div>
                <div className="hero-benefits" aria-label="Sinais rápidos de confiança">
                    <span><b>Sem conta</b> para testar</span>
                    <span><b>Sem cartão</b></span>
                    <span><b>Dados no navegador</b></span>
                </div>
            </section>

            <section className="prova-valor" aria-label="Por que usar o Riff Theory">
                <div className="prova-intro">
                    <span className="eyebrow">A diferença está no próximo clique</span>
                    <h2>Um estúdio para sair da consulta e tocar.</h2>
                    <p>Busca, braço, escala e metrônomo continuam conectados pelo mesmo contexto de prática, para você não perder o próximo passo ao trocar de ferramenta.</p>
                </div>
                <div className="prova-numeros">
                    <div className="prova-numero"><strong>1 clique</strong><span>para revelar a forma de um acorde no braço</span></div>
                    <div className="prova-numero"><strong>4 acordes</strong><span>em cada trilha guiada pronta para tocar</span></div>
                    <div className="prova-numero"><strong>20–400</strong><span>BPM no metrônomo para praticar no seu ritmo</span></div>
                </div>
                <div className="prova-recursos">
                    <div><strong>1. Escolha</strong><span>Comece com uma trilha ou acorde pronto.</span></div>
                    <div><strong>2. Veja</strong><span>A forma aparece no braço interativo.</span></div>
                    <div><strong>3. Toque</strong><span>Avance para o próximo acorde e ajuste o pulso quando precisar.</span></div>
                    <div className="prova-tempo"><strong>Teste rápido · cerca de 1 minuto</strong><span>Você já vê a primeira forma no braço no primeiro clique.</span></div>
                </div>
                <div className="comparacao"><strong>Alternativa comum:</strong> buscar → abrir abas → copiar o acorde. <strong>No Riff Theory:</strong> escolher → visualizar → tocar → repetir.</div>
                <div className="prova-credibilidade"><span><strong>Confira no próprio app:</strong> o botão “Testar trilha de 4 acordes” abre uma sequência no braço interativo; não é necessário criar conta para testar a prática.</span></div>
                <div className="trust-grid" aria-label="Sinais de confiança">
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Sem cartão para testar</strong><span>A prática guiada e o braço interativo podem ser explorados sem cadastro.</span></div></div>
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Progresso no navegador</strong><span>Histórico e dados de prática ficam no dispositivo; não são enviados para uma conta.</span></div></div>
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Transparência no Chatbot</strong><span>O Thonic exige login Google. Ao enviar uma pergunta, ela e o histórico recente são enviados ao serviço de IA para gerar a resposta.</span></div></div>
                </div>
                <button className="section-cta" type="button" onClick={() => iniciarTrilha(PROGRESSOES[0])}>
                    Testar no braço <span>sem conta</span>
                </button>
            </section>

            <section className="estudio-pratica" aria-labelledby="titulo-estudio">
                <div className="secao-heading">
                    <span className="eyebrow">Estúdio de prática</span>
                    <h2 id="titulo-estudio">A próxima ação fica no mesmo fluxo</h2>
                    <p>Comece pelo que você quer tocar e abra a ferramenta certa sem perder o acorde, a tonalidade ou o objetivo da sessão.</p>
                </div>
                <div className="estudio-pratica-grade">
                    <button type="button" onClick={() => { setPage?.("Dashboard"); }}>
                        <strong>Braço + acorde</strong>
                        <span>Veja a forma e avance por uma trilha curta.</span>
                    </button>
                    <button type="button" onClick={() => setPage?.("Escalas")}>
                        <strong>Escala + campo harmônico</strong>
                        <span>Entenda de onde vêm os acordes que você está tocando.</span>
                    </button>
                    <button type="button" onClick={() => setPage?.("Metrônomo")}>
                        <strong>Metrônomo + troca</strong>
                        <span>Defina um pulso e repita a progressão com intenção.</span>
                    </button>
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
                        <p>Veja como as notas formam os acordes do campo harmônico e teste cada forma no braço.</p>
                        <button className="pilula" onClick={() => setPage?.("Escalas")}>Explorar escalas</button>
                    </article>
                </div>
            </section>

            <section className="planos" aria-labelledby="titulo-planos">
                <div className="secao-heading">
                    <span className="eyebrow">Acesso e transparência</span>
                    <h2 id="titulo-planos">Comece grátis. Faça login só quando precisar.</h2>
                    <p>O primeiro teste acontece no navegador. O cadastro entra apenas nos recursos que precisam de conta.</p>
                </div>
                <div className="planos-grade">
                    <article className="plano-card plano-destaque">
                        <div className="plano-topo"><span className="plano-tag">Para experimentar</span><strong>Grátis para testar</strong></div>
                        <ul>
                            <li>Trilhas guiadas de acordes</li>
                            <li>Braço interativo e busca de acordes</li>
                            <li>Escalas, afinador e metrônomo</li>
                            <li>Sem cartão e sem conta para testar as ferramentas abertas</li>
                        </ul>
                        <button className="pilula" type="button" onClick={() => iniciarTrilha(PROGRESSOES[0])}>Testar no braço</button>
                    </article>
                    <article className="plano-card">
                        <div className="plano-topo"><span className="plano-tag plano-tag-premium">Com cadastro</span><strong>Premium · Thonic</strong></div>
                        <ul>
                            <li>Assistente para dúvidas de teoria musical</li>
                            <li>Login Google e histórico salvo na sua conta</li>
                            <li>Até 5 perguntas por minuto</li>
                            <li>Até 30 perguntas por hora, por usuário</li>
                        </ul>
                        <p className="plano-nota"><strong>Preço:</strong> ainda não publicado neste site. Ao enviar uma pergunta, o texto e o histórico recente são enviados ao serviço de IA para gerar a resposta.</p>
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
                <button className="section-cta section-cta-light" type="button" onClick={() => iniciarTrilha(PROGRESSOES[0])}>
                    Testar no braço <span>sem conta</span>
                </button>
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
            <div className="faq-list">
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
                <p className="simple-margin-top">Na dúvida, não fique se remoendo para achar a resposta! Nosso e-mail de suporte e feedback é <strong>rifftheory6@gmail.com</strong></p>
            </div>
        </div>
    )
}
