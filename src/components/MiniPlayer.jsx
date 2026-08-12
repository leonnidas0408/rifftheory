import { useEffect, useState } from "react";

import {
    inicializarSpotifyPlayer,
    alternarReproducao,
    adicionarListener,
} from "./pages/utils/spotifyPlayer";

import "./MiniPlayer.css";

export default function MiniPlayer({ token }) {
    const [titulo, setTitulo] = useState("Spotify");
    const [artista, setArtista] = useState("Nenhuma música tocando");
    const [imagem, setImagem] = useState("");
    const [tocando, setTocando] = useState(false);
    const [conectado, setConectado] = useState(false);

    useEffect(() => {
        const removerListener = adicionarListener((dados) => {
            if (dados.tipo === "ready") {
                setConectado(true);
                return;
            }

            if (dados.tipo === "not_ready") {
                setConectado(false);
                return;
            }

            if (dados.tipo === "state") {
                setTitulo(dados.titulo || "Spotify");
                setArtista(
                    dados.artista || "Nenhuma música tocando"
                );
                setImagem(dados.imagem || "");
                setTocando(Boolean(dados.tocando));
            }
        });

        if (!token) {
            return () => {
                if (removerListener) {
                    removerListener();
                }
            };
        }

        inicializarSpotifyPlayer(token)
            .then(() => {
                setConectado(true);
            })
            .catch((erro) => {
                console.error(
                    "Não foi possível inicializar o Spotify:",
                    erro
                );

                setConectado(false);
            });

        return () => {
            if (removerListener) {
                removerListener();
            }
        };
    }, [token]);

    async function handlePlayPause() {
        if (!conectado) {
            console.log(
                "Spotify ainda não está conectado."
            );
            return;
        }

        try {
            await alternarReproducao();
        } catch (erro) {
            console.error(
                "Erro ao alternar reprodução:",
                erro
            );
        }
    }

    return (
        <div className="mini-player">
            <div className="mini-player-cover">
                {imagem ? (
                    <img
                        src={imagem}
                        alt={`Capa de ${titulo}`}
                    />
                ) : (
                    <div className="mini-player-cover-placeholder">
                        ♪
                    </div>
                )}
            </div>

            <div className="mini-player-info">
                <strong>{titulo}</strong>

                <span>{artista}</span>
            </div>

            <button
                className="mini-player-play"
                onClick={handlePlayPause}
                type="button"
                aria-label={
                    tocando
                        ? "Pausar música"
                        : "Reproduzir música"
                }
            >
                {tocando ? "❚❚" : "▶"}
            </button>

            <div
                className={`mini-player-status ${
                    conectado ? "connected" : ""
                }`}
                title={
                    conectado
                        ? "Spotify conectado"
                        : "Spotify desconectado"
                }
            />
        </div>
    );
}