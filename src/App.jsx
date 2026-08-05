import { React, useState } from "react";
import { isDesktop } from "react-device-detect";
import Header from "./components/Header";
import NotaEEscala from "./components/NotaEEscala";
import Resultado from "./components/Resultado";
import RiffTheoryTuner from "./components/pages/RiffTheoryTuner";
import PaginaDeEscala from "./components/pages/PaginaDeEscala";
import BottomBar from "./components/BottomBarPages";
import Home from "./components/pages/Home";
import SidebarPages from "./components/SidebarPages";

export default function App() {
    const [page, setPage] = useState("Início");
    const pageData = {
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
    }
    const defaultPage = "Início";

    return (
        <div>
            <Header title="Riff Theory" span="Escalas · Campo harmônico · Braço interativo" icon="/icon.jpg"/>
            {
                isDesktop ?
                <SidebarPages page={page} setPage={setPage} pageData={pageData} defaultPage={defaultPage}/>
                : <BottomBar page={page} setPage={setPage} pageData={pageData} defaultPage={defaultPage}/>
            }
        </div>
    )
}
