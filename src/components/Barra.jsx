import React from "react";
import Icone from "./Icone";

// Barra arredondada abaixo das abas: lupa à esquerda, conteúdo no meio
// (campo de busca ou título) e, à direita, ícone da conta ou botão de busca.
export default function Barra({ titulo, children, onBuscar, botaoBusca }) {
    return (
        <div className="barra">
            {onBuscar ? (
                <button className="barra-lupa" onClick={onBuscar} aria-label="Buscar">
                    <Icone nome="busca" />
                </button>
            ) : (
                <span className="barra-lupa"><Icone nome="busca" /></span>
            )}

            <div className="barra-centro">
                {children ?? <h1 className="barra-titulo">{titulo}</h1>}
            </div>

            {botaoBusca ? (
                <button className="barra-botao" onClick={onBuscar} aria-label="Buscar">
                    <Icone nome="busca" />
                </button>
            ) : (
                <span className="barra-conta"><Icone nome="conta" tamanho={28} /></span>
            )}
        </div>
    );
}
