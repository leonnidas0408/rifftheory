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
                <span>Um hub de cifras, um aplicativo de tutorial e uma ferramenta para criação de tablaturas e colaboração tudo em um.</span>
            </PrettyPanel>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)"
            }}>
                <div style={{
                    display: "grid",
                    gridTemplateRows: "repeat(2, 1fr)"
                }}>
                    <PrettyPanel>
                        <h3>Escalas</h3>
                        <span>Gerar escalas e acordes</span>
                        <span>Digite uma nota e uma escala para gerar acordes e visualizar tudo direto no braço da guitarra.</span>
                        <button className="highlight" onClick={() => setPage("Escalas")}>Explorar →</button>
                    </PrettyPanel>
                    <PrettyPanel>
                        <h3>Como usar</h3>
                        <span>Vá em <b>Escalas</b>, digite algo como <i>C maior</i>, <i>Am</i> ou <i>G blues</i> e toque em Gerar. O braço mostra a tônica em roxo e as notas da escala em azul.</span>
                    </PrettyPanel>
                </div>
                <PrettyPanel>
                    <h3>Metrônomo</h3>
                    <span>Treine seu tempo</span>
                    <button className="highlight" onClick={() => setPage("Metrônomo")}>Explorar →</button>
                </PrettyPanel>
            </div>
        </div>
    )
}