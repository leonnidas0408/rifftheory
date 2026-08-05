import React from "react";
import PrettyPanel from "../PrettyPanel";
import DramaticTitle from "../DramaticTitle";
import DramaticCTA from "../DramaticCTA";

export default function Home({ setPage }) {
    return (
        <div>
            <PrettyPanel>
                <DramaticTitle title="Riff Theory"/>
                <DramaticCTA actions={["CRIE", "ESTUDE", "EVOLUA"]}/>
                <span>Digite uma nota e uma escala para gerar acordes e visualizar tudo direto no braço da guitarra.</span>
                <button className="highlight" onClick={() => setPage("Escalas")}>Explorar escalas →</button>
                <button className="highlight" onClick={() => setPage("Metrônomo")}>Metrônomo →</button>
            </PrettyPanel>
        </div>
    )
}