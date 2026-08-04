import React from "react";
import Header from "./components/Header";
import NotaEEscala from "./components/NotaEEscala";
import Resultado from "./components/Resultado";
import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import BottomBar from "./components/BottomBarPages";
import Home from "./components/pages/Home";

export default function App() {
    return (
        <div>
            <Header title="Riff Theory" span="Escalas · Campo harmônico · Braço interativo" icon="/icon.jpg"/>
            <BottomBar pageData={{
                "Início": {
                    "page": <Home/>,
                    "icon": "/home.png"
                },
                "Escalas": {
                    "page": <PaginaDeEscala/>,
                    "icon": "/musical_note.png"
                },
                "Afinador": {
                    "page": <RiffTheoryTuner/>,
                    "icon": "/musical_note.png"
                }
            }} defaultPage="Início"/>
        </div>
    )
}
