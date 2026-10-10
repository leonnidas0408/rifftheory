import { useEffect, useState } from "react";

import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import Dashboard from "./components/pages/Dashboard";
import Metronomo from "./components/pages/Metronomo";
import ChatbotTab from "./components/ChatbotTab/ChatbotTab";

import NavbarAdapter from "./components/NavbarAdapter";

import { iniciarRastreioDeUso } from "./utils/usageStats";
import Home from "./components/pages/Home";

export default function App() {
    const [page, setPage] = useState("Início");

    useEffect(() => {
        const pararRastreio =
            iniciarRastreioDeUso();

        return pararRastreio;
    }, []);

    const pageData = {
        "Início": {
            page: <Home setPage={setPage}/>,
            icone: "inicio",
            aba: "inicio"
        },

        "Dashboard": {
            page: <Dashboard setPage={setPage} />,
            icone: "lista",
            aba: "lista"
        },

        "Escalas": {
            page: (
                <PaginaDeEscala
                    setPage={setPage}
                />
            ),
            icone: "escalas",
            aba: "lista",
        },

        "Afinador": {
            page: (
                <RiffTheoryTuner
                    setPage={setPage}
                />
            ),
            icone: "nota",
            aba: "nota"
        },

        "Metrônomo": {
            page: (
                <Metronomo
                    setPage={setPage}
                />
            ),
            icone: "play",
            aba: "play"
        },

        "Chatbot": {
            page: (
                <ChatbotTab />
            ),
        },
    };

    const defaultPage = "Início";

    return (
        <div>
            <NavbarAdapter
                page={page}
                setPage={setPage}
                pageData={pageData}
                defaultPage={defaultPage}
            />
        </div>
    );
}