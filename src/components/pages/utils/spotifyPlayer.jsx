let player = null;
let deviceId = null;
let accessToken = null;

let sdkPromise = null;

const listeners = new Set();

function notificar(dados) {
    listeners.forEach((callback) => {
        try {
            callback(dados);
        } catch (erro) {
            console.error(
                "Erro no listener do Spotify:",
                erro
            );
        }
    });
}

function carregarSpotifySDK() {
    if (window.Spotify) {
        return Promise.resolve(window.Spotify);
    }

    if (sdkPromise) {
        return sdkPromise;
    }

    sdkPromise = new Promise((resolve, reject) => {
        const scriptExistente =
            document.querySelector(
                'script[src="https://sdk.scdn.co/spotify-player.js"]'
            );

        if (scriptExistente) {
            const verificar = setInterval(() => {
                if (window.Spotify) {
                    clearInterval(verificar);
                    resolve(window.Spotify);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(verificar);

                if (!window.Spotify) {
                    reject(
                        new Error(
                            "O Spotify Web Playback SDK não carregou."
                        )
                    );
                }
            }, 10000);

            return;
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
            resolve(window.Spotify);
        };

        const script =
            document.createElement("script");

        script.src =
            "https://sdk.scdn.co/spotify-player.js";

        script.async = true;

        script.onerror = () => {
            reject(
                new Error(
                    "Não foi possível carregar o Spotify Web Playback SDK."
                )
            );
        };

        document.body.appendChild(script);
    });

    return sdkPromise;
}

export async function inicializarSpotifyPlayer(token) {
    if (!token) {
        console.warn(
            "Token do Spotify não foi fornecido."
        );

        return null;
    }

    accessToken = token;

    /*
     * Se já existe um player conectado,
     * não cria outro.
     */
    if (player) {
        return player;
    }

    try {
        await carregarSpotifySDK();
    } catch (erro) {
        console.error(
            "Erro ao carregar Spotify SDK:",
            erro
        );

        notificar({
            tipo: "error",
            mensagem: erro.message,
        });

        return null;
    }

    if (!window.Spotify) {
        console.error(
            "Spotify Web Playback SDK não está disponível."
        );

        return null;
    }

    player = new window.Spotify.Player({
        name: "Riff Theory Player",

        getOAuthToken: (callback) => {
            callback(accessToken);
        },

        volume: 0.5,
    });

    player.addListener(
        "ready",
        ({ device_id }) => {
            deviceId = device_id;

            console.log(
                "Spotify Player conectado:",
                device_id
            );

            notificar({
                tipo: "ready",
                deviceId: device_id,
            });
        }
    );

    player.addListener(
        "not_ready",
        ({ device_id }) => {
            console.log(
                "Spotify Player desconectado:",
                device_id
            );

            if (deviceId === device_id) {
                deviceId = null;
            }

            notificar({
                tipo: "not_ready",
                deviceId: device_id,
            });
        }
    );

    player.addListener(
        "player_state_changed",
        (state) => {
            if (!state) {
                return;
            }

            const track =
                state.track_window?.current_track;

            notificar({
                tipo: "state",
                estado: state,

                titulo:
                    track?.name || "",

                artista:
                    track?.artists
                        ?.map(
                            (artist) =>
                                artist.name
                        )
                        .join(", ") || "",

                imagem:
                    track?.album
                        ?.images?.[0]?.url || "",

                tocando:
                    !state.paused,
            });
        }
    );

    player.addListener(
        "initialization_error",
        ({ message }) => {
            console.error(
                "Erro de inicialização do Spotify:",
                message
            );

            notificar({
                tipo: "error",
                mensagem: message,
            });
        }
    );

    player.addListener(
        "authentication_error",
        ({ message }) => {
            console.error(
                "Erro de autenticação do Spotify:",
                message
            );

            notificar({
                tipo: "error",
                mensagem: message,
            });
        }
    );

    player.addListener(
        "account_error",
        ({ message }) => {
            console.error(
                "Erro na conta do Spotify:",
                message
            );

            notificar({
                tipo: "error",
                mensagem: message,
            });
        }
    );

    player.addListener(
        "playback_error",
        ({ message }) => {
            console.error(
                "Erro de reprodução do Spotify:",
                message
            );

            notificar({
                tipo: "error",
                mensagem: message,
            });
        }
    );

    player.addListener(
        "autoplay_failed",
        () => {
            console.warn(
                "O navegador bloqueou a reprodução automática."
            );

            notificar({
                tipo: "autoplay_failed",
            });
        }
    );

    const conectado =
        await player.connect();

    if (!conectado) {
        console.error(
            "Não foi possível conectar o Spotify Player."
        );

        notificar({
            tipo: "error",
            mensagem:
                "Não foi possível conectar ao Spotify.",
        });

        return null;
    }

    return player;
}

export async function alternarReproducao() {
    if (!player) {
        console.warn(
            "Spotify Player ainda não foi inicializado."
        );

        return;
    }

    await player.togglePlay();
}

export async function pausar() {
    if (!player) {
        return;
    }

    await player.pause();
}

export async function reproduzir() {
    if (!player) {
        return;
    }

    await player.resume();
}

export async function proximaFaixa() {
    if (!player) {
        return;
    }

    await player.nextTrack();
}

export async function faixaAnterior() {
    if (!player) {
        return;
    }

    await player.previousTrack();
}

export async function definirVolume(volume) {
    if (!player) {
        return;
    }

    const valor =
        Math.max(
            0,
            Math.min(1, Number(volume))
        );

    await player.setVolume(valor);
}

export function adicionarListener(callback) {
    if (typeof callback !== "function") {
        return () => {};
    }

    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
}

export function obterPlayer() {
    return player;
}

export function obterDeviceId() {
    return deviceId;
}

export function obterAccessToken() {
    return accessToken;
}

export function estaInicializado() {
    return Boolean(player);
}

export async function desconectarSpotifyPlayer() {
    if (!player) {
        return;
    }

    try {
        await player.disconnect();
    } catch (erro) {
        console.error(
            "Erro ao desconectar Spotify Player:",
            erro
        );
    }

    player = null;
    deviceId = null;
    accessToken = null;

    notificar({
        tipo: "not_ready",
    });
}