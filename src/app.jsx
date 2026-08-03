import React from "react";
import Header from "./components/header";
import NotaEEscala from "./components/nota_e_escala_input";
import Resultado from "./components/resultado";

export default function App() {
    return (
        <div>
            <Header title="Riff Theory" span="Escalas · Campo harmônico · Braço interativo" icon="/icon.png"/>
            <NotaEEscala/>
            <Resultado/>
        </div>
    )
}