import React from "react";
import IconButton from "./IconButton";
import Conteudo from "./Conteudo";

export default function BottomBar({ page, setPage, pageData }) {
    return (
        <div>
            <Conteudo page={page} setPage={setPage} pageData={pageData} />

            <div className="bottom-bar">
                {Object.entries(pageData)
                    .filter(([, item]) => item.icone)
                    .map(([chave, item]) => (
                        <IconButton
                            key={chave}
                            onClick={() => setPage(chave)}
                            label={chave}
                            icon={item.icone}
                            selected={page === chave || (chave === "Início" && page === "Chatbot")}
                        />
                    ))}
            </div>
        </div>
    );
}
