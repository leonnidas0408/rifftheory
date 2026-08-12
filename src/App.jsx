import { useEffect, useState } from "react";

import Header from "./components/Header";
import NotaEEscala from "./components/NotaEEscala";
import Resultado from "./components/Resultado";

import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import Home from "./components/pages/Home";
import Metronomo from "./components/pages/Metronomo";
import SpotifyTab from "./components/SpotifyTab";

import NavbarAdapter from "./components/NavbarAdapter";

import { iniciarRastreioDeUso } from "./utils/usageStats";
import { obterTokenSpotify } from "./utils/spotifyAuth";

export default function App() {
    const [page, setPage] = useState("Início");

    useEffect(() => {
        const pararRastreio =
            iniciarRastreioDeUso();

        return pararRastreio;
    }, []);

    const pageData = {
        "Início": {
            page: (
                <Home
                    setPage={setPage}
                />
            ),
            icon: "/home.png",
        },

        "Escalas": {
            page: (
                <PaginaDeEscala
                    setPage={setPage}
                />
            ),
            icon: "/musical_note.png",
        },

        "Afinador": {
            page: (
                <RiffTheoryTuner
                    setPage={setPage}
                />
            ),
            icon: "/audio.png",
        },

        "Metrônomo": {
            page: (
                <Metronomo
                    setPage={setPage}
                />
            ),
            icon: "/audio.png",
        },

        "Spotify": {
            page: (
                <SpotifyTab
                    token={obterTokenSpotify()}
                />
            ),
            icon: "/spotify.png",
        },
    };

    const defaultPage = "Início";

    return (
        <div>
            <Header />

            <NavbarAdapter
                page={page}
                setPage={setPage}
                pageData={pageData}
                defaultPage={defaultPage}
            />
        </div>
    );
}