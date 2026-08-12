import { useState } from "react";

import IconButton from "./IconButton";
import DramaticTitle from "./DramaticTitle";
import SpotifyLogin from "./SpotifyLogin";
import MiniPlayer from "./MiniPlayer";
import SpotifyTab from "./SpotifyTab";

import { obterTokenSpotify } from "../utils/spotifyAuth";

export default function SidebarPages({
    page,
    setPage,
    pageData,
    defaultPage,
}) {
    const [spotifyToken, setSpotifyToken] = useState(() =>
        obterTokenSpotify()
    );

    function handleSpotifyToken(token) {
        setSpotifyToken(token);
    }

    // A aba "Spotify" é especial: em vez de usar o elemento
    // pré-montado em pageData, ela recebe o token que já vive
    // aqui no sidebar (o mesmo usado pelo MiniPlayer).
    const conteudoPagina =
        page === "Spotify" ? (
            <SpotifyTab token={spotifyToken} />
        ) : (
            pageData[page].page
        );

    return (
        <div>
            <div className="sidebar">
                <div className="sidebar-logo">
                    <DramaticTitle title="Riff Theory" />
                </div>

                {Object.entries(pageData).map(
                    ([key, item]) => (
                        <IconButton
                            key={key}
                            onClick={() => setPage(key)}
                            label={key}
                            icon={item.icon}
                            selected={page === key}
                        />
                    )
                )}

                <div className="sidebar-spotify">
                    <SpotifyLogin
                        onTokenChange={
                            handleSpotifyToken
                        }
                    />

                    <MiniPlayer
                        token={spotifyToken}
                    />
                </div>
            </div>

            <div
                style={{
                    marginLeft: "220px",
                }}
            >
                {conteudoPagina}
            </div>
        </div>
    );
}