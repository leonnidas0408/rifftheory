import { useEffect, useState } from "react";

import {
    iniciarLoginSpotify,
    obterTokenSpotify,
    removerTokenSpotify,
    processarCallbackSpotify,
} from "../utils/spotifyAuth";

export default function SpotifyLogin({ onTokenChange }) {
    const [conectado, setConectado] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;

        async function verificarSpotify() {
            try {
                setCarregando(true);
                setErro("");

                // 1. Verifica se já existe um token salvo
                const token = obterTokenSpotify();

                if (token) {
                    if (!ativo) return;

                    setConectado(true);

                    if (onTokenChange) {
                        onTokenChange(token);
                    }

                    return;
                }

                // 2. Verifica se estamos voltando do Spotify
                const parametros = new URLSearchParams(
                    window.location.search
                );

                const temCodigo = parametros.has("code");
                const temErro = parametros.has("error");

                if (!temCodigo && !temErro) {
                    return;
                }

                // 3. Processa o callback
                const dados = await processarCallbackSpotify();

                if (!ativo) return;

                if (dados?.access_token) {
                    setConectado(true);

                    if (onTokenChange) {
                        onTokenChange(dados.access_token);
                    }

                    // Limpa ?code=... da URL
                    window.history.replaceState(
                        {},
                        document.title,
                        window.location.pathname
                    );
                }
            } catch (error) {
                console.error(
                    "Erro na autenticação do Spotify:",
                    error
                );

                if (ativo) {
                    setConectado(false);

                    setErro(
                        error?.message ||
                            "Erro ao conectar ao Spotify."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        verificarSpotify();

        return () => {
            ativo = false;
        };
    }, [onTokenChange]);

    async function conectar() {
        setErro("");
        setCarregando(true);

        try {
            await iniciarLoginSpotify();
        } catch (error) {
            console.error(
                "Erro ao iniciar login do Spotify:",
                error
            );

            setErro(
                error?.message ||
                    "Não foi possível iniciar o login do Spotify."
            );

            setCarregando(false);
        }
    }

    function desconectar() {
        removerTokenSpotify();

        setConectado(false);

        if (onTokenChange) {
            onTokenChange(null);
        }
    }

    if (carregando) {
        return (
            <div className="spotify-login">
                <span>Verificando Spotify...</span>
            </div>
        );
    }

    return (
        <div className="spotify-login">
            {conectado ? (
                <button
                    type="button"
                    onClick={desconectar}
                    className="spotify-login-button connected"
                >
                    Spotify conectado
                </button>
            ) : (
                <button
                    type="button"
                    onClick={conectar}
                    className="spotify-login-button"
                >
                    Conectar Spotify
                </button>
            )}

            {erro && (
                <span className="spotify-login-error">
                    {erro}
                </span>
            )}
        </div>
    );
}