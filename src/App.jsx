import React from "react";
import Header from "./components/Header";
import NotaEEscala from "./components/NotaEEscala";
import Resultado from "./components/Resultado";
import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import SidebarPages from "./components/SidebarPages";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";

export default function App() {
    return (
        <div>
            <Header title="Riff Theory" span="Escalas · Campo harmônico · Braço interativo" icon="/icon.jpg"/>
            <SidebarPages pages={{
                "Escalas": <PaginaDeEscala/>,
                "Afinador": <RiffTheoryTuner/>
            }} defaultPage="Escalas"/>
        </div>
    )
}
