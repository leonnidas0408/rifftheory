const API_BASE = "https://api.spotify.com/v1";

async function chamarSpotifyApi(endpoint, token, opcoes = {}) {
    const resposta = await fetch(`${API_BASE}${endpoint}`, {
        ...opcoes,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(opcoes.headers || {}),
        },
    });

    if (resposta.status === 204) {
        return null;
    }

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        const mensagem =
            dados?.error?.message ||
            `Erro na API do Spotify (${resposta.status})`;

        throw new Error(mensagem);
    }

    return dados;
}

export async function buscarSpotify(query, token, tipos = ["track", "artist"]) {
    if (!query?.trim()) {
        return { faixas: [], artistas: [] };
    }

    const parametros = new URLSearchParams({
        q: query,
        type: tipos.join(","),
        limit: "10",
    });

    const dados = await chamarSpotifyApi(
        `/search?${parametros.toString()}`,
        token
    );

    return {
        faixas: dados?.tracks?.items || [],
        artistas: dados?.artists?.items || [],
    };
}

export async function obterPlaylistsUsuario(token) {
    const dados = await chamarSpotifyApi("/me/playlists?limit=50", token);

    return dados?.items || [];
}

export async function obterFaixasPlaylist(playlistId, token) {
    const dados = await chamarSpotifyApi(
        `/playlists/${playlistId}/tracks?limit=50`,
        token
    );

    return (dados?.items || [])
        .map((item) => item.track)
        .filter(Boolean);
}

export async function tocarFaixas(uris, deviceId, token, posicao = 0) {
    await chamarSpotifyApi(
        `/me/player/play?device_id=${deviceId}`,
        token,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uris,
                offset: { position: posicao },
            }),
        }
    );
}

export async function tocarContexto(contextUri, deviceId, token, faixaUri) {
    const corpo = { context_uri: contextUri };

    if (faixaUri) {
        corpo.offset = { uri: faixaUri };
    }

    await chamarSpotifyApi(
        `/me/player/play?device_id=${deviceId}`,
        token,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
        }
    );
}
