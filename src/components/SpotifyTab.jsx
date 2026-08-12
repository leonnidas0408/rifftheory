import { useEffect, useState } from "react";

import SpotifyLogin from "./SpotifyLogin";

import {
    adicionarListener,
    obterDeviceId,
    alternarReproducao,
    proximaFaixa,
    faixaAnterior,
} from "./pages/utils/spotifyPlayer";

import {
    buscarSpotify,
    obterPlaylistsUsuario,
    obterFaixasPlaylist,
    tocarFaixas,
    tocarContexto,
} from "../utils/spotifyApi";

import "./SpotifyTab.css";

export default function SpotifyTab({ token }) {
    const [busca, setBusca] = useState("");
    const [resultados, setResultados] = useState({
        faixas: [],
        artistas: [],
    });
    const [buscando, setBuscando] = useState(false);

    const [playlists, setPlaylists] = useState([]);
    const [carregandoPlaylists, setCarregandoPlaylists] = useState(false);
    const [playlistSelecionada, setPlaylistSelecionada] = useState(null);
    const [faixasPlaylist, setFaixasPlaylist] = useState([]);

    const [erro, setErro] = useState("");

    const [faixaAtual, setFaixaAtual] = useState(null);
    const [tocando, setTocando] = useState(false);
    const [dispositivoPronto, setDispositivoPronto] = useState(
        Boolean(obterDeviceId())
    );

    // Escuta o mesmo player global usado pelo MiniPlayer,
    // então os controles ficam sincronizados em todo o app.
    useEffect(() => {
        const remover = adicionarListener((dados) => {
            if (dados.tipo === "ready") {
                setDispositivoPronto(true);
            }

            if (dados.tipo === "not_ready") {
                setDispositivoPronto(false);
            }

            if (dados.tipo === "state") {
                setFaixaAtual({
                    titulo: dados.titulo,
                    artista: dados.artista,
                    imagem: dados.imagem,
                });

                setTocando(dados.tocando);
            }
        });

        return remover;
    }, []);

    // Carrega as playlists do usuário assim que o token existe.
    useEffect(() => {
        if (!token) {
            setPlaylists([]);
            return;
        }

        let ativo = true;

        async function carregar() {
            setCarregandoPlaylists(true);
            setErro("");

            try {
                const dados = await obterPlaylistsUsuario(token);

                if (ativo) {
                    setPlaylists(dados);
                }
            } catch (error) {
                if (ativo) {
                    setErro(error.message);
                }
            } finally {
                if (ativo) {
                    setCarregandoPlaylists(false);
                }
            }
        }

        carregar();

        return () => {
            ativo = false;
        };
    }, [token]);

    async function handleBuscar(evento) {
        evento.preventDefault();

        if (!token || !busca.trim()) {
            return;
        }

        setBuscando(true);
        setErro("");

        try {
            const dados = await buscarSpotify(busca, token);
            setResultados(dados);
        } catch (error) {
            setErro(error.message);
        } finally {
            setBuscando(false);
        }
    }

    async function handleAbrirPlaylist(playlist) {
        setPlaylistSelecionada(playlist);
        setErro("");

        try {
            const faixas = await obterFaixasPlaylist(playlist.id, token);
            setFaixasPlaylist(faixas);
        } catch (error) {
            setErro(error.message);
        }
    }

    async function handleTocarFaixa(uri) {
        const deviceId = obterDeviceId();

        if (!deviceId) {
            setErro(
                "O player do Spotify ainda não está pronto. Aguarde alguns segundos."
            );

            return;
        }

        try {
            await tocarFaixas([uri], deviceId, token);
        } catch (error) {
            setErro(error.message);
        }
    }

    async function handleTocarPlaylist(playlist, faixaUri) {
        const deviceId = obterDeviceId();

        if (!deviceId) {
            setErro(
                "O player do Spotify ainda não está pronto. Aguarde alguns segundos."
            );

            return;
        }

        try {
            await tocarContexto(playlist.uri, deviceId, token, faixaUri);
        } catch (error) {
            setErro(error.message);
        }
    }

    if (!token) {
        return (
            <div className="spotify-tab spotify-tab-deslogado">
                <p>
                    Conecte sua conta do Spotify para buscar músicas, ver
                    suas playlists e controlar a reprodução por aqui.
                </p>

                <SpotifyLogin onTokenChange={() => {}} />
            </div>
        );
    }

    return (
        <div className="spotify-tab">
            <header className="spotify-tab-header">
                <h2>Spotify</h2>

                <form
                    className="spotify-tab-busca"
                    onSubmit={handleBuscar}
                >
                    <input
                        type="text"
                        placeholder="Buscar músicas ou artistas..."
                        value={busca}
                        onChange={(evento) =>
                            setBusca(evento.target.value)
                        }
                    />

                    <button type="submit" disabled={buscando}>
                        {buscando ? "Buscando..." : "Buscar"}
                    </button>
                </form>
            </header>

            {erro && (
                <div className="spotify-tab-erro">{erro}</div>
            )}

            {faixaAtual && (
                <div className="spotify-tab-player-atual">
                    <div className="spotify-tab-player-capa">
                        {faixaAtual.imagem ? (
                            <img
                                src={faixaAtual.imagem}
                                alt={`Capa de ${faixaAtual.titulo}`}
                            />
                        ) : (
                            <div className="spotify-tab-player-capa-placeholder">
                                ♪
                            </div>
                        )}
                    </div>

                    <div className="spotify-tab-player-info">
                        <strong>{faixaAtual.titulo}</strong>
                        <span>{faixaAtual.artista}</span>
                    </div>

                    <div className="spotify-tab-player-controles">
                        <button
                            type="button"
                            onClick={faixaAnterior}
                            aria-label="Faixa anterior"
                        >
                            ⏮
                        </button>

                        <button
                            type="button"
                            onClick={alternarReproducao}
                            aria-label={tocando ? "Pausar" : "Tocar"}
                        >
                            {tocando ? "❚❚" : "▶"}
                        </button>

                        <button
                            type="button"
                            onClick={proximaFaixa}
                            aria-label="Próxima faixa"
                        >
                            ⏭
                        </button>
                    </div>
                </div>
            )}

            {(resultados.faixas.length > 0 ||
                resultados.artistas.length > 0) && (
                <section className="spotify-tab-secao">
                    <h3>Resultados da busca</h3>

                    {resultados.faixas.length > 0 && (
                        <div className="spotify-tab-lista-faixas">
                            {resultados.faixas.map((faixa) => (
                                <div
                                    className="spotify-tab-item-faixa"
                                    key={faixa.id}
                                >
                                    <div className="spotify-tab-item-capa">
                                        {faixa.album?.images?.[2]?.url ? (
                                            <img
                                                src={
                                                    faixa.album.images[2]
                                                        .url
                                                }
                                                alt={faixa.name}
                                            />
                                        ) : null}
                                    </div>

                                    <div className="spotify-tab-item-info">
                                        <strong>{faixa.name}</strong>
                                        <span>
                                            {faixa.artists
                                                ?.map((a) => a.name)
                                                .join(", ")}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTocarFaixa(faixa.uri)
                                        }
                                        disabled={!dispositivoPronto}
                                        aria-label={`Tocar ${faixa.name}`}
                                    >
                                        ▶
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {resultados.artistas.length > 0 && (
                        <div className="spotify-tab-lista-artistas">
                            {resultados.artistas.map((artista) => (
                                <div
                                    className="spotify-tab-item-artista"
                                    key={artista.id}
                                >
                                    <div className="spotify-tab-item-capa spotify-tab-item-capa-redonda">
                                        {artista.images?.[2]?.url ? (
                                            <img
                                                src={
                                                    artista.images[2].url
                                                }
                                                alt={artista.name}
                                            />
                                        ) : null}
                                    </div>

                                    <span>{artista.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="spotify-tab-secao">
                <h3>Suas playlists</h3>

                {carregandoPlaylists ? (
                    <span>Carregando playlists...</span>
                ) : (
                    <div className="spotify-tab-grid-playlists">
                        {playlists.map((playlist) => (
                            <button
                                type="button"
                                key={playlist.id}
                                className={`spotify-tab-card-playlist ${
                                    playlistSelecionada?.id ===
                                    playlist.id
                                        ? "selecionada"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleAbrirPlaylist(playlist)
                                }
                            >
                                <div className="spotify-tab-card-capa">
                                    {playlist.images?.[0]?.url ? (
                                        <img
                                            src={playlist.images[0].url}
                                            alt={playlist.name}
                                        />
                                    ) : (
                                        <div className="spotify-tab-card-capa-placeholder">
                                            ♪
                                        </div>
                                    )}
                                </div>

                                <span>{playlist.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {playlistSelecionada && (
                <section className="spotify-tab-secao">
                    <h3>{playlistSelecionada.name}</h3>

                    <div className="spotify-tab-lista-faixas">
                        {faixasPlaylist.map((faixa) => (
                            <div
                                className="spotify-tab-item-faixa"
                                key={faixa.id}
                            >
                                <div className="spotify-tab-item-capa">
                                    {faixa.album?.images?.[2]?.url ? (
                                        <img
                                            src={
                                                faixa.album.images[2].url
                                            }
                                            alt={faixa.name}
                                        />
                                    ) : null}
                                </div>

                                <div className="spotify-tab-item-info">
                                    <strong>{faixa.name}</strong>
                                    <span>
                                        {faixa.artists
                                            ?.map((a) => a.name)
                                            .join(", ")}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleTocarPlaylist(
                                            playlistSelecionada,
                                            faixa.uri
                                        )
                                    }
                                    disabled={!dispositivoPronto}
                                    aria-label={`Tocar ${faixa.name}`}
                                >
                                    ▶
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
