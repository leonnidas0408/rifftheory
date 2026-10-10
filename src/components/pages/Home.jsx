import { React, useEffect, useState } from "react";
import Barra from "../Barra";
import BracoInterativo from "../BracoInterativo";
import ChordSearch from "../Chord/ChordSearch";

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
    const [, atualizar] = useState(0);
    const [trilha, setTrilha] = useState(null);
    const [abrirEscolha, setAbrirEscolha] = useState(0);

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
            <section className="hero">
                <div className="hero-kicker">Seu estúdio de guitarra em um só fluxo</div>
                <h1>Toque a próxima música entendendo o que está no braço.</h1>
                <p>
                    Encontre uma cifra, veja os acordes no braço e descubra formas mais fáceis de
                    tocar em minutos — sem alternar entre várias ferramentas.
                </p>
                <div className="hero-acoes">
                    <button
                        className="link-botao hero-cta"
                        onClick={() => {
                            registrarEvento("hero_cta_clicked", { cta: "pratica_guiada" });
                            iniciarTrilha(PROGRESSOES[0]);
                        }}
                    >
                        Começar agora
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
                    <span>Gratuito para começar · sem instalação · sem cadastro · prática e progresso locais.</span>
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
                    <div className="prova-numero"><strong>30–260</strong><span>BPM no metrônomo para praticar no seu ritmo</span></div>
                </div>
                <div className="prova-recursos">
                    <div><strong>1. Escolha</strong><span>Comece com uma trilha ou acorde pronto.</span></div>
                    <div><strong>2. Veja</strong><span>A forma aparece no braço interativo.</span></div>
                    <div><strong>3. Toque</strong><span>Avance para o próximo acorde sem trocar de ferramenta.</span></div>
                </div>
                <div className="comparacao"><strong>Alternativa comum:</strong> buscar → abrir abas → copiar o acorde. <strong>No Riff Theory:</strong> escolher → visualizar → tocar.</div>
                <div className="prova-credibilidade"><span><strong>Fluxo verificável:</strong> você pode testar o primeiro acorde sem criar conta e conferir o resultado no braço.</span></div>
                <div className="trust-grid" aria-label="Sinais de confiança">
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Fluxo verificável</strong><span>Teste a experiência principal antes de decidir se ela serve para sua prática.</span></div></div>
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Progresso local</strong><span>Acordes, histórico e prática ficam no navegador; o Chatbot é a exceção.</span></div></div>
                    <div className="trust-item"><span className="trust-check">✓</span><div><strong>Resultado visível</strong><span>O primeiro acorde aparece no braço ao iniciar a prática.</span></div></div>
                </div>
            </section>

            <section className="objecoes" aria-labelledby="titulo-objecoes">
                <div className="secao-heading">
                    <span className="eyebrow">Antes de começar</span>
                    <h2 id="titulo-objecoes">Feito para testar sem compromisso</h2>
                </div>
                <div className="objecoes-grid">
                    <div><strong>Preço</strong><span><b>Gratuito para começar.</b> Não há cartão nem plano obrigatório nesta experiência.</span></div>
                    <div><strong>Setup</strong><span><b>Abra e toque.</b> Funciona no navegador, sem instalar programa ou configurar conta.</span></div>
                    <div><strong>Segurança</strong><span><b>Prática e progresso ficam no navegador.</b> Perguntas ao Chatbot são enviadas à API para gerar respostas.</span></div>
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
                    <p>Exemplos baseados no que você consegue fazer hoje no app. Quando houver avaliações reais, elas entrarão aqui.</p>
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

                <ChordSearch />

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
        </div>
    )
}