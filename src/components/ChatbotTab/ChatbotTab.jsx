import { useEffect, useRef, useState } from "react";

import Barra from "../Barra";
import Icone from "../Icone";
import { useAuth } from "../../auth/AuthContext";

import "./ChatbotTab.css";

function horaAgora() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const MAX_MENSAGENS_CONTEXTO = 12;

const MENSAGEM_BOAS_VINDAS = {
    autor: "bot",
    hora: horaAgora(),
    texto:
        "E aí! Meu nome é Thonic e eu sou o assistente do Riff Theory. Pode perguntar sobre teoria " +
        "musical, escalas, acordes, harmonia, intervalos, técnica no violão/" +
        "guitarra e afins — esse é o meu único assunto. 🎸",
};

const FALAS_THONIC = [
    { fala: "Quer destravar um acorde?", pergunta: "Como posso tocar um acorde fácil no violão?" },
    { fala: "Vamos montar uma progressão?", pergunta: "Sugira uma progressão simples para praticar." },
    { fala: "Uma dica para escalas?", pergunta: "Como escolho uma escala para improvisar?" },
];

export default function ChatbotTab() {
    const { session } = useAuth();
    const [mensagens, setMensagens] = useState([MENSAGEM_BOAS_VINDAS]);
    const [entrada, setEntrada] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    const fimDaListaRef = useRef(null);

    useEffect(() => {
        fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens, carregando]);

    async function enviarMensagem(evento) {
        evento.preventDefault();

        const texto = entrada.trim();
        if (!texto || carregando) return;

        const novaMensagemUsuario = { autor: "usuario", texto, hora: horaAgora() };
        const historicoAtualizado = [...mensagens, novaMensagemUsuario];

        setMensagens(historicoAtualizado);
        setEntrada("");
        setErro("");
        setCarregando(true);

        try {
            const resposta = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({
                    // Mantém a conversa visível sem limite; envia só o contexto recente.
                    mensagens: historicoAtualizado.slice(-MAX_MENSAGENS_CONTEXTO).map((m) => ({
                        autor: m.autor,
                        texto: m.texto,
                    })),
                }),
            });

            if (!resposta.ok) {
                const corpoErro = await resposta.json().catch(() => ({}));
                throw new Error(
                    corpoErro.erro ||
                        "Não consegui falar com o servidor agora."
                );
            }

            const dados = await resposta.json();

            setMensagens((atual) => [
                ...atual,
                { autor: "bot", texto: dados.resposta, hora: horaAgora() },
            ]);
        } catch (err) {
            setErro(
                err.message ||
                    "Algo deu errado ao tentar responder. Tenta de novo."
            );
        } finally {
            setCarregando(false);
        }
    }

    function novaConversa() {
        if (carregando) return;
        setMensagens([{ ...MENSAGEM_BOAS_VINDAS, hora: horaAgora() }]);
        setEntrada("");
        setErro("");
    }

    return (
        <div className="pagina chatbot-tab">
            <div className="chatbot-topo">
                <div className="chatbot-barra">
                    <Barra titulo="Riff Theory" />
                </div>

                <button
                    className="chatbot-nova"
                    onClick={novaConversa}
                    aria-label="Nova conversa"
                    title="Nova conversa"
                >
                    <Icone nome="lapis" tamanho={24} />
                </button>
            </div>

            <div className="chatbot-mensagens">
                {mensagens.map((mensagem, indice) => (
                    <div
                        key={indice}
                        className={`chatbot-linha chatbot-linha-${mensagem.autor}`}
                    >
                        <span className="chatbot-avatar">
                            {mensagem.autor === "bot" ? (
                                <img src="/thonic.webp" alt="Thonic" />
                            ) : (
                                <Icone nome="conta" tamanho={22} />
                            )}
                        </span>

                        <div className={`chatbot-bolha chatbot-bolha-${mensagem.autor}`}>
                            <p>{mensagem.texto}</p>
                            <time>{mensagem.hora}</time>
                        </div>
                    </div>
                ))}

                {mensagens.length === 1 && !carregando && (
                    <div className="chatbot-falas" aria-label="Balões de sugestão do Thonic">
                        <p className="chatbot-falas-intro">Toque numa fala do Thonic para começar:</p>
                        <div className="chatbot-falas-lista">
                            {FALAS_THONIC.map(({ fala, pergunta }) => (
                                <button
                                    key={fala}
                                    type="button"
                                    className="chatbot-fala"
                                    onClick={() => setEntrada(pergunta)}
                                    title="Usar como pergunta"
                                >
                                    {fala}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {carregando && (
                    <div className="chatbot-linha chatbot-linha-bot">
                        <span className="chatbot-avatar">
                            <img src="/thonic.webp" alt="Thonic está digitando" />
                        </span>
                        <div className="chatbot-bolha chatbot-bolha-bot chatbot-digitando">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={fimDaListaRef} />
            </div>

            {erro && <div className="chatbot-erro">{erro}</div>}

            <form className="chatbot-form" onSubmit={enviarMensagem}>
                <input
                    type="text"
                    value={entrada}
                    onChange={(e) => setEntrada(e.target.value)}
                    placeholder="Pergunte sobre escalas, acordes, harmonia..."
                    aria-label="Mensagem"
                    disabled={carregando}
                />
                <button
                    type="submit"
                    aria-label="Enviar"
                    disabled={carregando || !entrada.trim()}
                >
                    <Icone nome="enviar" tamanho={22} />
                </button>
            </form>
            <p className="chatbot-privacidade">
                Não precisa entrar com Google. O app não aplica uma cota fixa de mensagens por pessoa; a IA usa as últimas 12 mensagens como contexto. Os limites próprios da Groq ainda podem se aplicar.
            </p>
        </div>
    );
}
