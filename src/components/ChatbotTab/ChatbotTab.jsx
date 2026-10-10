import { useEffect, useRef, useState } from "react";

import Barra from "../Barra";
import Icone from "../Icone";
import { useAuth } from "../../auth/AuthContext";

import "./ChatbotTab.css";

function horaAgora() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const MENSAGEM_BOAS_VINDAS = {
    autor: "bot",
    hora: horaAgora(),
    texto:
        "E aí! Eu sou o assistente do Riff Theory. Pode perguntar sobre teoria " +
        "musical, escalas, acordes, harmonia, intervalos, técnica no violão/" +
        "guitarra e afins — esse é o meu único assunto. 🎸",
};

export default function ChatbotTab() {
    const { user, session, loading: authLoading, authConfigured, signInWithGoogle, error: authError } = useAuth();
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
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({
                    // Manda só autor/texto pro backend remontar a conversa.
                    mensagens: historicoAtualizado.map((m) => ({
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

    if (authLoading) {
        return (
            <div className="pagina chatbot-tab chatbot-gate">
                <Barra titulo="Assistente de teoria" />
                <div className="chatbot-gate-card">Verificando sua conta...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="pagina chatbot-tab chatbot-gate">
                <Barra titulo="Assistente de teoria" />
                <div className="chatbot-gate-card">
                    <span className="chatbot-gate-icon" aria-hidden="true">Acesso protegido</span>
                    <h2>Entre para usar a IA</h2>
                    <p>O assistente envia suas perguntas a um serviço de IA. Faça login com Google para continuar.</p>
                    <button className="chatbot-login" type="button" onClick={signInWithGoogle}>
                        <span className="google-mark" aria-hidden="true">G</span>
                        Entrar com Google
                    </button>
                    {!authConfigured && <small>O login ainda precisa ser configurado neste ambiente.</small>}
                    {authError && <div className="chatbot-erro" role="alert">{authError}</div>}
                </div>
            </div>
        );
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
                            <Icone nome={mensagem.autor === "bot" ? "riffs" : "conta"} tamanho={22} />
                        </span>

                        <div className={`chatbot-bolha chatbot-bolha-${mensagem.autor}`}>
                            <p>{mensagem.texto}</p>
                            <time>{mensagem.hora}</time>
                        </div>
                    </div>
                ))}

                {carregando && (
                    <div className="chatbot-linha chatbot-linha-bot">
                        <span className="chatbot-avatar">
                            <Icone nome="riffs" tamanho={22} />
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
                Para responder, sua pergunta e o histórico recente desta conversa são enviados ao serviço de IA. O progresso da prática continua local no navegador.
            </p>
        </div>
    );
}
