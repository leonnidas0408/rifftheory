import { useEffect, useState } from "react";

import SpotifyLogin from "./SpotifyLogin";
import SpotifyEmbedPlayer from "./SpotifyEmbedPlayer";

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
    buscarSpotifyPublico,
} from "../utils/spotifyApi";

import {
    iniciarLoginSpotify,
    removerTokenSpotify,
} from "../utils/spotifyAuth";

import { isMobile } from "react-device-detect";

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

    // Estado da busca pública (sem login), usado só quando não há token.
    const [buscaPublica, setBuscaPublica] = useState("");
    const [resultadosPublicos, setResultadosPublicos] = useState({
        faixas: [],
        artistas: [],
    });
    const [buscandoPublico, setBuscandoPublico] = useState(false);
    const [erroPublico, setErroPublico] = useState("");
    const [faixaEmbedUri, setFaixaEmbedUri] = useState(null);
    const [embedUri, setEmbedUri] = useState(null);
    const [playlistsRestritas, setPlaylistsRestritas] = useState(false);

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
                    setPlaylistsRestritas(
                        /403|forbidden|insufficient client scope/i.test(
                            error.message
                        )
                    );
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

        if (!busca.trim()) {
            return;
        }

        setBuscando(true);
        setErro("");

        try {
            const dados = token
                ? await buscarSpotify(busca, token)
                : await buscarSpotifyPublico(busca);
            setResultados(dados);
        } catch (error) {
            // Token existe mas não está na allowlist (403) — cai pra busca pública
            if (token && error.message.includes("403")) {
                try {
                    const dados = await buscarSpotifyPublico(busca);
                    setResultados(dados);
                } catch (erroPublico) {
                    setErro(erroPublico.message);
                }
            } else {
                setErro(error.message);
            }
        } finally {
            setBuscando(false);
        }
    }

    async function handleBuscarPublico(evento) {
        evento.preventDefault();

        if (!buscaPublica.trim()) {
            return;
        }

        setBuscandoPublico(true);
        setErroPublico("");

        try {
            const dados = await buscarSpotifyPublico(buscaPublica);
            setResultadosPublicos(dados);
        } catch (error) {
            setErroPublico(error.message);
        } finally {
            setBuscandoPublico(false);
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
            setPlaylistsRestritas(
                /403|forbidden|insufficient client scope/i.test(
                    error.message
                )
            );
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

    function handlePlayOuEmbed(faixaUri) {
        if (!isMobile && dispositivoPronto) {
            handleTocarFaixa(faixaUri);
        } else {
            setEmbedUri(faixaUri);
        }
    }

    function handlePlaylistOuEmbed(faixa) {
        if (!isMobile && dispositivoPronto) {
            handleTocarPlaylist(playlistSelecionada, faixa.uri);
        } else {
            setEmbedUri(faixa.uri);
        }
    }

    function fecharEmbed() {
        setEmbedUri(null);
    }

    function reconectarSpotify() {
        removerTokenSpotify();

        iniciarLoginSpotify();
    }

    if (!token) {
        return (
            <div className="spotify-tab spotify-tab-deslogado">
                <p>
                    Conecte sua conta do Spotify para ver suas playlists e
                    controlar a reprodução por aqui. Ou busque e ouça
                    músicas sem precisar entrar:
                </p>

                <SpotifyLogin onTokenChange={() => {}} />

                <form
                    className="spotify-tab-busca"
                    onSubmit={handleBuscarPublico}
                >
                    <input
                        type="text"
                        placeholder="Buscar músicas ou artistas..."
                        value={buscaPublica}
                        onChange={(evento) =>
                            setBuscaPublica(evento.target.value)
                        }
                    />

                    <button type="submit" disabled={buscandoPublico}>
                        {buscandoPublico ? "Buscando..." : "Buscar"}
                    </button>
                </form>

                {erroPublico && (
                    <div className="spotify-tab-erro">{erroPublico}</div>
                )}

                {faixaEmbedUri && (
                    <SpotifyEmbedPlayer spotifyUri={faixaEmbedUri} />
                )}

                {resultadosPublicos.faixas.length > 0 && (
                    <div className="spotify-tab-lista-faixas">
                        {resultadosPublicos.faixas.map((faixa) => (
                            <div
                                className="spotify-tab-item-faixa"
                                key={faixa.id}
                            >
                                <div className="spotify-tab-item-capa">
                                    {faixa.album?.images?.[2]?.url ? (
                                        <img
                                            src={faixa.album.images[2].url}
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
                                        setFaixaEmbedUri(faixa.uri)
                                    }
                                    aria-label={`Tocar ${faixa.name}`}
                                >
                                    ▶
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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

            {playlistsRestritas && (
                <div className="spotify-tab-erro-playlists">
                    <p>
                        As playlists não carregaram (erro 403). Isso costuma
                        acontecer quando o login é antigo e as permissões ficaram
                        desatualizadas, ou quando a conta não está autorizada no
                        painel do Spotify. Reconecte a conta ou abra direto no
                        app do Spotify:
                    </p>

                    <div className="spotify-tab-acoes-403">
                        <a
                            href={
                                playlistSelecionada
                                    ? `https://open.spotify.com/playlist/${playlistSelecionada.id}`
                                    : "https://open.spotify.com"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Abrir no app do Spotify
                        </a>

                        <button
                            type="button"
                            onClick={reconectarSpotify}
                        >
                            Reconectar conta
                        </button>
                    </div>
                </div>
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

            {embedUri && (
                <section className="spotify-tab-embed">
                    <div className="spotify-tab-embed-topo">
                        <span>Player rápido</span>

                        <button
                            type="button"
                            onClick={fecharEmbed}
                            aria-label="Fechar player"
                        >
                            ✕
                        </button>
                    </div>

                    <SpotifyEmbedPlayer spotifyUri={embedUri} />
                </section>
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
                                            handlePlayOuEmbed(faixa.uri)
                                        }
                                        disabled={
                                            !dispositivoPronto && !isMobile
                                        }
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
                                        handlePlaylistOuEmbed(faixa)
                                    }
                                    disabled={
                                        !dispositivoPronto && !isMobile
                                    }
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