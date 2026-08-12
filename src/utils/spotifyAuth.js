const CLIENT_ID =
    import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const REDIRECT_URI =
    import.meta.env.VITE_SPOTIFY_REDIRECT_URI ||
    `${window.location.origin}/callback`;

const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-read-collaborative",
].join(" ");

const VERIFIER_KEY = "spotify_pkce_verifier";
const STATE_KEY = "spotify_pkce_state";
const TOKEN_KEY = "spotify_access_token";
const EXPIRES_KEY = "spotify_token_expires_at";
const REFRESH_KEY = "spotify_refresh_token";

function gerarStringAleatoria(tamanho = 64) {
    const caracteres =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    const valores = new Uint32Array(tamanho);

    window.crypto.getRandomValues(valores);

    return Array.from(
        valores,
        (valor) =>
            caracteres[
                valor % caracteres.length
            ]
    ).join("");
}

async function gerarCodeChallenge(verifier) {
    const encoder = new TextEncoder();

    const data = encoder.encode(verifier);

    const digest =
        await window.crypto.subtle.digest(
            "SHA-256",
            data
        );

    const bytes = new Uint8Array(digest);

    let string = "";

    bytes.forEach((byte) => {
        string += String.fromCharCode(byte);
    });

    return btoa(string)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export async function iniciarLoginSpotify() {
    if (!CLIENT_ID) {
        throw new Error(
            "VITE_SPOTIFY_CLIENT_ID não foi configurado no arquivo .env."
        );
    }

    if (!window.crypto?.subtle) {
        throw new Error(
            "O navegador não disponibiliza criptografia segura para o PKCE."
        );
    }

    const verifier =
        gerarStringAleatoria(96);

    const challenge =
        await gerarCodeChallenge(verifier);

    const state =
        gerarStringAleatoria(32);

    sessionStorage.setItem(
        VERIFIER_KEY,
        verifier
    );

    sessionStorage.setItem(
        STATE_KEY,
        state
    );

    const parametros =
        new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: "code",
            redirect_uri: REDIRECT_URI,
            scope: SCOPES,
            code_challenge_method: "S256",
            code_challenge: challenge,
            state,
        });

    const url =
        "https://accounts.spotify.com/authorize?" +
        parametros.toString();

    window.location.assign(url);
}

export async function processarCallbackSpotify() {
    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const code =
        parametros.get("code");

    const state =
        parametros.get("state");

    const erro =
        parametros.get("error");

    if (erro) {
        throw new Error(
            `Spotify recusou a autorização: ${erro}`
        );
    }

    if (!code) {
        return null;
    }

    if (!CLIENT_ID) {
        throw new Error(
            "VITE_SPOTIFY_CLIENT_ID não foi configurado no arquivo .env."
        );
    }

    const estadoSalvo =
        sessionStorage.getItem(
            STATE_KEY
        );

    if (
        !estadoSalvo ||
        state !== estadoSalvo
    ) {
        throw new Error(
            "Falha de segurança: o estado da autorização do Spotify não confere."
        );
    }

    const verifier =
        sessionStorage.getItem(
            VERIFIER_KEY
        );

    if (!verifier) {
        throw new Error(
            "Code verifier do Spotify não foi encontrado. Tente conectar novamente."
        );
    }

    const resposta = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
            },

            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type:
                    "authorization_code",
                code,
                redirect_uri:
                    REDIRECT_URI,
                code_verifier:
                    verifier,
            }),
        }
    );

    const dados =
        await resposta.json();

    if (!resposta.ok) {
        console.error(
            "Erro ao obter token do Spotify:",
            dados
        );

        throw new Error(
            dados.error_description ||
                dados.error ||
                "Não foi possível obter o token do Spotify."
        );
    }

    salvarToken(
        dados.access_token,
        dados.expires_in
    );

    if (dados.refresh_token) {
        localStorage.setItem(
            REFRESH_KEY,
            dados.refresh_token
        );
    }

    sessionStorage.removeItem(
        VERIFIER_KEY
    );

    sessionStorage.removeItem(
        STATE_KEY
    );

    return dados;
}

function salvarToken(
    token,
    expiresIn
) {
    const expiraEm =
        Date.now() +
        Number(expiresIn || 3600) *
            1000;

    localStorage.setItem(
        TOKEN_KEY,
        token
    );

    localStorage.setItem(
        EXPIRES_KEY,
        String(expiraEm)
    );
}

export function obterTokenSpotify() {
    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    const expiraEm =
        Number(
            localStorage.getItem(
                EXPIRES_KEY
            )
        );

    if (!token) {
        return null;
    }

    if (
        expiraEm &&
        Date.now() >= expiraEm
    ) {
        removerTokenSpotify();

        return null;
    }

    return token;
}

export function removerTokenSpotify() {
    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        EXPIRES_KEY
    );

    localStorage.removeItem(
        REFRESH_KEY
    );

    sessionStorage.removeItem(
        VERIFIER_KEY
    );

    sessionStorage.removeItem(
        STATE_KEY
    );
}

export function estaConectadoSpotify() {
    return Boolean(
        obterTokenSpotify()
    );
}