import React from "react";
import Icone from "./Icone";

// Área principal: abas de ferramentas no topo, página atual e o botão
// flutuante que abre o assistente (chat).
export default function Conteudo({ page, setPage, pageData }) {
    const abas = Object.entries(pageData).filter(([, item]) => item.aba);

    return (
        <main className="conteudo">
            <nav className="abas" aria-label="Ferramentas">
                {abas.map(([chave, item]) => (
                    <button
                        key={chave}
                        className={`aba${page === chave ? " ativa" : ""}`}
                        onClick={() => setPage(chave)}
                    >
                        <Icone nome={item.aba} tamanho={20} />
                        {chave}
                    </button>
                ))}
            </nav>

            {pageData[page].page}

            {page !== "Chatbot" && (
                <button
                    className="fab-chat"
                    aria-label="Abrir assistente"
                    onClick={() => setPage("Chatbot")}
                >
                    <Icone nome="chat" tamanho={28} />
                </button>
            )}
        </main>
    );
}
