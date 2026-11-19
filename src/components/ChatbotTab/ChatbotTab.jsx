import { useEffect, useRef, useState } from "react";

import Barra from "../Barra";
import AvatarUsuario from "../AvatarUsuario";
import Icone from "../Icone";
import ThonicAvatar from "../ThonicAvatar";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../auth/supabase";
import "./ChatbotTab.css";
import Markdown from "react-markdown";
import { THONIC_BALOES_ATIVOS_KEY, lerBaloesAtivos } from "../thonicBaloes";

const CONVERSA_STORAGE_PREFIXO = "riffTheoryThonicConversation:v1:";
const MAX_MENSAGENS_SALVAS = 100;
const PERGUNTAS_INICIAIS = [
    "Como funciona o campo harmônico maior?",
    "Qual é a diferença entre acorde maior e menor?",
    "Quando usar a pentatônica menor sobre um acorde?",
    "Como praticar a troca entre C e G?",
];

function horaAgora() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function mensagemBoasVindas() {
    return {
        autor: "bot",
        hora: horaAgora(),
        texto:
            "E aí! Meu nome é Thonic e eu sou o assistente do Riff Theory. Pode perguntar sobre teoria " +
            "musical, escalas, acordes, harmonia, intervalos, técnica no violão/" +
            "guitarra e afins — esse é o meu único assunto. 🎸",
    };
}

function normalizarMensagens(valor) {
    if (!Array.isArray(valor)) return [];

    return valor
        .filter((mensagem) => (
            mensagem &&
            (mensagem.autor === "usuario" || mensagem.autor === "bot") &&
            typeof mensagem.texto === "string" &&
            mensagem.texto.trim()
        ))
        .map((mensagem) => ({
            autor: mensagem.autor,
            texto: mensagem.texto.trim(),
            hora: typeof mensagem.hora === "string" && mensagem.hora ? mensagem.hora : horaAgora(),
            anexos: Array.isArray(mensagem.anexos)
                ? mensagem.anexos.slice(0, 5).map((arquivo) => ({
                    nome: String(arquivo?.nome || "Arquivo anexado").slice(0, 180),
                    tipo: String(arquivo?.tipo || "").slice(0, 120),
                    tamanho: Number.isFinite(Number(arquivo?.tamanho)) ? Number(arquivo.tamanho) : 0,
                }))
                : [],
        }))
        .slice(-MAX_MENSAGENS_SALVAS);
}

function lerArquivoComoDataUrl(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error(`Não foi possível ler ${arquivo.name}.`));
        reader.readAsDataURL(arquivo);
    });
}

export default function ChatbotTab() {
    const { session, user, loading: authLoading, authConfigured, signInWithGoogle, error: authError } = useAuth();
    const [mensagens, setMensagens] = useState([]);
    const [entrada, setEntrada] = useState("");
    const [anexosTesteAtivo, setAnexosTesteAtivo] = useState(false);
    const [arquivosTeste, setArquivosTeste] = useState([]);
    const inputArquivosRef = useRef(null);
    const [carregando, setCarregando] = useState(false);
    const [carregandoConversa, setCarregandoConversa] = useState(false);
    const [erro, setErro] = useState("");
    const [configuracoesAbertas, setConfiguracoesAbertas] = useState(false);
    const [baloesAtivos, setBaloesAtivos] = useState(lerBaloesAtivos);

    const fimDaListaRef = useRef(null);
    const conversaCarregadaRef = useRef(false);
    const timerPersistenciaRef = useRef(null);

    const storageKey = user?.id ? `${CONVERSA_STORAGE_PREFIXO}${user.id}` : null;

    function alternarBaloes(evento) {
        const ativo = evento.target.checked;
        setBaloesAtivos(ativo);
        window.localStorage.setItem(THONIC_BALOES_ATIVOS_KEY, ativo ? "1" : "0");
        window.dispatchEvent(new CustomEvent("riff-thonic-bubble-settings", {
            detail: { baloesAtivos: ativo },
        }));
    }

    useEffect(() => {
        const chave = "riffThonicAttachmentsTest";
        const atualizar = () => {
            const ativo = window.localStorage.getItem(chave) === "1";
            setAnexosTesteAtivo(ativo);
            if (!ativo) setArquivosTeste([]);
        };
        atualizar();
        window.addEventListener("storage", atualizar);
        window.addEventListener("riff-thonic-attachments-test", atualizar);
        return () => {
            window.removeEventListener("storage", atualizar);
            window.removeEventListener("riff-thonic-attachments-test", atualizar);
        };
    }, []);
    useEffect(() => {
        fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens, carregando]);

    useEffect(() => {
        let ativo = true;
        conversaCarregadaRef.current = false;
        setMensagens([]);

        if (!user?.id) return undefined;

        async function carregarConversa() {
            setCarregandoConversa(true);
            let conversa = [];

            try {
                const local = window.localStorage.getItem(storageKey);
                conversa = normalizarMensagens(local ? JSON.parse(local) : []);
            } catch {
                // O localStorage pode estar indisponível no modo privado.
            }

            if (supabase) {
                const { data, error: loadError } = await supabase
                    .from("thonic_conversations")
                    .select("messages")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (!loadError && data?.messages) {
                    conversa = normalizarMensagens(data.messages);
                }
            }

            if (!ativo) return;
            setMensagens(conversa.length ? conversa : [mensagemBoasVindas()]);
            conversaCarregadaRef.current = true;
            setCarregandoConversa(false);
        }

        carregarConversa().catch(() => {
            if (!ativo) return;
            setMensagens([mensagemBoasVindas()]);
            conversaCarregadaRef.current = true;
            setCarregandoConversa(false);
        });

        return () => {
            ativo = false;
        };
    }, [user?.id, storageKey]);

    useEffect(() => {
        if (!storageKey || !conversaCarregadaRef.current || !mensagens.length) return undefined;

        const mensagensParaSalvar = normalizarMensagens(mensagens);
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(mensagensParaSalvar));
        } catch {
            // O histórico remoto continua sendo usado quando o localStorage falhar.
        }

        window.clearTimeout(timerPersistenciaRef.current);
        timerPersistenciaRef.current = window.setTimeout(async () => {
            if (!supabase || !user?.id) return;
            await supabase.from("thonic_conversations").upsert({
                user_id: user.id,
                messages: mensagensParaSalvar,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
        }, 350);

        return () => window.clearTimeout(timerPersistenciaRef.current);
    }, [mensagens, storageKey, user?.id]);

    async function enviarMensagem(evento) {
        evento.preventDefault();

        const texto = entrada.trim() || (arquivosTeste.length ? "Interprete os arquivos anexados." : "");
        if (!texto || carregando || carregandoConversa) return;
        const tamanhoTotalArquivos = arquivosTeste.reduce((total, arquivo) => total + arquivo.size, 0);
        if (arquivosTeste.length > 5 || tamanhoTotalArquivos > 2_800_000) {
            setErro("Selecione no máximo 5 arquivos e até 2,8 MB no total.");
            return;
        }
        if (arquivosTeste.filter((arquivo) => arquivo.type.startsWith("image/")).length > 3) {
            setErro("O Thonic aceita até 3 imagens por envio.");
            return;
        }

        const anexosDaMensagem = arquivosTeste.map((arquivo) => ({
            nome: arquivo.name,
            tipo: arquivo.type || "",
            tamanho: arquivo.size,
        }));
        const novaMensagemUsuario = { autor: "usuario", texto, hora: horaAgora(), anexos: anexosDaMensagem };
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
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    mensagens: historicoAtualizado.slice(-12).map((m) => ({
                        autor: m.autor,
                        texto: m.texto,
                    })),
                    anexos: await Promise.all(arquivosTeste.map(async (arquivo) => ({
                        nome: arquivo.name,
                        tipo: arquivo.type || "application/octet-stream",
                        dados: (await lerArquivoComoDataUrl(arquivo)).split(",")[1],
                    }))),
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
            setArquivosTeste([]);

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
        if (carregando || carregandoConversa) return;
        setMensagens([mensagemBoasVindas()]);
        setEntrada("");
        setArquivosTeste([]);
        setErro("");
    }

    if (authLoading) {
        return (
            <div className="pagina chatbot-tab chatbot-gate">
                <Barra titulo="Assistente de teoria" />
                <div className="chatbot-gate-card" role="status" aria-live="polite">
                    Verificando sua conta...
                </div>
            </div>
        );
    }

    if (!session?.access_token) {
        return (
            <div className="pagina chatbot-tab chatbot-gate">
                <Barra titulo="Assistente de teoria" />
                <section className="chatbot-gate-card" aria-labelledby="chatbot-gate-title">
                    <span className="chatbot-gate-icon" aria-hidden="true">Acesso protegido</span>
                    <h2 id="chatbot-gate-title">Entre para usar o Thonic</h2>
                    <p>O assistente responde sobre música e teoria musical. Faça login com Google para enviar perguntas.</p>
                    <button className="chatbot-login" type="button" onClick={signInWithGoogle} disabled={!authConfigured}>
                        <span className="google-mark" aria-hidden="true">G</span>
                        Entrar com Google
                    </button>
                    {!authConfigured && <small>O login Google ainda não está configurado neste ambiente.</small>}
                    {authError && <div className="chatbot-erro" role="alert">{authError}</div>}
                </section>
            </div>
        );
    }

    if (carregandoConversa) {
        return (
            <div className="pagina chatbot-tab chatbot-gate">
                <Barra titulo="Assistente de teoria" />
                <div className="chatbot-gate-card" role="status" aria-live="polite">
                    Recuperando sua conversa com o Thonic...
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

                <div className="chatbot-acoes">
                    <button
                        type="button"
                        className={`chatbot-configuracoes${configuracoesAbertas ? " ativo" : ""}`}
                        onClick={() => setConfiguracoesAbertas((aberta) => !aberta)}
                        aria-label="Configurações do Thonic"
                        aria-expanded={configuracoesAbertas}
                        title="Configurações do Thonic"
                    >
                        <Icone nome="configuracoes" tamanho={22} />
                    </button>
                    <button
                        type="button"
                        className="chatbot-nova"
                        onClick={novaConversa}
                        aria-label="Nova conversa"
                        title="Nova conversa"
                    >
                        <Icone nome="novaConversa" tamanho={24} />
                    </button>
                    {configuracoesAbertas && (
                        <div className="chatbot-configuracoes-painel" role="dialog" aria-label="Configurações do Thonic">
                            <strong>Configurações do Thonic</strong>
                            <label>
                                <input type="checkbox" checked={baloesAtivos} onChange={alternarBaloes} />
                                <span>Mostrar balões do Thonic</span>
                            </label>
                            <small>Os balões aparecem no site a cada 3 minutos.</small>
                        </div>
                    )}
                </div>
            </div>

            <div className="chatbot-mensagens">
                {mensagens.map((mensagem, indice) => (
                    <div
                        key={`${mensagem.autor}-${indice}`}
                        className={`chatbot-linha chatbot-linha-${mensagem.autor}`}
                    >
                        <span className="chatbot-avatar">
                            {mensagem.autor === "bot" ? (
                                <ThonicAvatar alt="Thonic" size={42} />
                            ) : (
                                <AvatarUsuario tamanho={42} />
                            )}
                        </span>

                        <div className={`chatbot-bolha chatbot-bolha-${mensagem.autor}`}>
                            <Markdown>{mensagem.texto}</Markdown>
                            {mensagem.anexos?.length > 0 && (
                                <ul className="chatbot-anexos-mensagem" aria-label="Arquivos anexados nesta mensagem">
                                    {mensagem.anexos.map((arquivo, arquivoIndice) => (
                                        <li key={`${arquivo.nome}-${arquivoIndice}`}>
                                            <Icone nome="clipe" tamanho={14} />
                                            <span title={arquivo.tipo || "Arquivo anexado"}>{arquivo.nome}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <time>{mensagem.hora}</time>
                        </div>
                    </div>
                ))}


                {carregando && (
                    <div className="chatbot-linha chatbot-linha-bot">
                        <span className="chatbot-avatar">
                            <ThonicAvatar alt="Thonic está digitando" size={42} />
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

            {mensagens.length <= 1 && !carregando && (
                <section className="chatbot-perguntas" aria-label="Exemplos de perguntas sobre teoria musical">
                    <strong>Comece por uma dúvida de teoria</strong>
                    <div>
                        {PERGUNTAS_INICIAIS.map((pergunta) => (
                            <button key={pergunta} type="button" onClick={() => setEntrada(pergunta)}>
                                {pergunta}
                            </button>
                        ))}
                    </div>
                    <small>O Thonic explica teoria e técnica; ele não cria músicas ou letras.</small>
                </section>
            )}

            {erro && <div className="chatbot-erro">{erro}</div>}

            <form className="chatbot-form" onSubmit={enviarMensagem}>
                {(user?.app_metadata?.plan === "premium" || anexosTesteAtivo) && (
                    <>
                        <input
                            ref={inputArquivosRef}
                            className="chatbot-input-arquivos"
                            type="file"
                            multiple
                            onChange={(event) => {
                                const novos = Array.from(event.target.files || []);
                                setArquivosTeste((atuais) => [...atuais, ...novos]);
                                event.target.value = "";
                            }}
                            aria-label="Selecionar arquivos de qualquer tipo"
                        />
                        <button
                            type="button"
                            className="chatbot-anexar"
                            onClick={() => inputArquivosRef.current?.click()}
                            disabled={carregando}
                            title={`Anexar arquivo${arquivosTeste.length ? ` (${arquivosTeste.length} selecionados)` : ""}`}
                            aria-label={`Anexar arquivo${arquivosTeste.length ? `, ${arquivosTeste.length} selecionados` : ""}`}
                        >
                            <Icone nome="clipe" tamanho={19} />
                        </button>
                    </>
                )}
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
                    disabled={carregando || (!entrada.trim() && arquivosTeste.length === 0)}
                >
                    <Icone nome="enviar" tamanho={22} />
                </button>
            </form>
            <p className="chatbot-privacidade">
                Sua conversa é salva na sua conta. Com anexos, o conteúdo é processado pelo serviço de IA para gerar a resposta; limites de uso se aplicam.
            </p>
        </div>
    );
}
