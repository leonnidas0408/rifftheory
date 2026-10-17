import { useEffect, useState } from "react";

import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import Dashboard from "./components/pages/Dashboard";
import Metronomo from "./components/pages/Metronomo";
import Tablaturas from "./components/pages/Tablaturas";
import Pratica from "./components/pages/Pratica";
import ChatbotTab from "./components/ChatbotTab/ChatbotTab";
import NavbarAdapter from "./components/NavbarAdapter";
import { iniciarRastreioDeUso } from "./utils/usageStats";
import Home from "./components/pages/Home";
import { AuthProvider } from "./auth/AuthContext";
import { AccessConsentManager } from "./components/AccessConsent";
import AccessMonitor from "./components/pages/AccessMonitor";

export default function App() {
    const isAccessMonitorRoute = window.location.pathname.replace(/\/+$/, "") === "/admin/acessos";

    return (
        <AuthProvider>
            {isAccessMonitorRoute ? <AccessMonitor /> : <RiffTheoryApp />}
        </AuthProvider>
    );
}

function RiffTheoryApp() {
    const [page, setPage] = useState("Início");

    useEffect(() => {
        const pararRastreio = iniciarRastreioDeUso();
        return pararRastreio;
    }, []);

    const pageData = {
        "Início": { page: <Home setPage={setPage} />, icone: "inicio", aba: "inicio" },
        "Dashboard": { page: <Dashboard setPage={setPage} />, icone: "lista", aba: "lista" },
        "Escalas": { page: <PaginaDeEscala setPage={setPage} />, icone: "escalas", aba: "escalas" },
        "Afinador": { page: <RiffTheoryTuner setPage={setPage} />, icone: "nota", aba: "nota" },
        "Metrônomo": { page: <Metronomo setPage={setPage} />, icone: "play", aba: "play" },
        "Tablaturas": { page: <Tablaturas />, icone: "tablaturas", aba: "tablaturas" },
        "Prática": { page: <Pratica />, icone: "riffs", aba: "riffs" },
        "Chatbot": { page: <ChatbotTab /> },
    };

    return (
        <>
            <NavbarAdapter
                page={page}
                setPage={setPage}
                pageData={pageData}
                defaultPage="Início"
            />
            <AccessConsentManager />
        </>
    );
}
