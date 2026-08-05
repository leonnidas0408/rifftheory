import { React, useState } from "react";
import Header from "./components/Header";
import NotaEEscala from "./components/NotaEEscala";
import Resultado from "./components/Resultado";
import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import BottomBar from "./components/BottomBarPages";
import Home from "./components/pages/Home";

export default function App() {
    const [page, setPage] = useState("Início");

    return (
        <div>
            <Header title="Riff Theory" span="Escalas · Campo harmônico · Braço interativo" icon="/icon.jpg"/>
            <BottomBar page={page} setPage={setPage} pageData={{
                "Início": {
                    "page": <Home setPage={setPage}/>,
                    "icon": "/home.png"
                },
                "Escalas": {
                    "page": <PaginaDeEscala setPage={setPage}/>,
                    "icon": "/musical_note.png"
                },
                "Afinador": {
                    "page": <RiffTheoryTuner setPage={setPage}/>,
                    "icon": "/musical_note.png"
                }
            }} defaultPage="Início"/>
        </div>
    )
}
