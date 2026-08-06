import React from "react";
import PrettyPanel from "../PrettyPanel";
import DramaticTitle from "../DramaticTitle";
import DramaticCTA from "../DramaticCTA";

export default function Home({ setPage }) {
    return (
    <div>
        <PrettyPanel>
            <DramaticTitle title="Riff Theory"/>
            <span>
                Um hub de cifras, um aplicativo de tutorial e uma ferramenta para criação de tablaturas e colaboração tudo em um.
            </span>
        </PrettyPanel>

        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "20px"
        }}>

            <PrettyPanel>
                <h3>🎙 Afinador</h3>
                <span>Afinar instrumentos</span>
                <button 
                    className="highlight"
                    onClick={() => setPage("Afinador")}
                >
                    Abrir →
                </button>
            </PrettyPanel>

            <PrettyPanel>
                <h3>⏱ Metrônomo</h3>
                <span>Treine seu tempo</span>
                <button 
                    className="highlight"
                    onClick={() => setPage("Metrônomo")}
                >
                    Abrir →
                </button>
            </PrettyPanel>

            <PrettyPanel>
                <h3>🎸 Escalas</h3>
                <span>Crie escalas e acordes</span>
                <button 
                    className="highlight"
                    onClick={() => setPage("Escalas")}
                >
                    Abrir →
                </button>
            </PrettyPanel>

        </div>


        <PrettyPanel>
            <h3>Banners</h3>
            <div style={{
                height: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                Em breve
            </div>
        </PrettyPanel>


        <PrettyPanel>
            <h3>Braço Interativo</h3>
            <div style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                Braço de guitarra em desenvolvimento
            </div>
        </PrettyPanel>

    </div>
)
}