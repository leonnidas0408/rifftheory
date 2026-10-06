import { useEffect, useState } from "react";

import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import Home from "./components/pages/Home";
import Metronomo from "./components/pages/Metronomo";
import ChatbotTab from "./components/ChatbotTab/ChatbotTab";

import NavbarAdapter from "./components/NavbarAdapter";

import { iniciarRastreioDeUso } from "./utils/usageStats";

export default function App() {
    const [page, setPage] = useState("Início");

    useEffect(() => {
        const pararRastreio =
            iniciarRastreioDeUso();

        return pararRastreio;
    }, []);

    const pageData = {
        "Início": {
            page: <Home setPage={setPage} />,
            icone: "inicio",
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
            aba: "nota",
            soMobile: true,
        },

        "Metrônomo": {
            page: (
                <Metronomo
                    setPage={setPage}
                />
            ),
            icone: "play",
            aba: "play",
            soMobile: true,
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