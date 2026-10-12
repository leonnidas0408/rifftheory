import React from "react";

// Ícones em traço único, com silhuetas próprias para cada ferramenta.
const CAMINHOS = {
    inicio: <><path d="m3.5 10.5 8.5-7 8.5 7" /><path d="M5.5 9.5V20h5v-6h3v6h5V9.5" /></>,
    lista: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M7.5 15.5v-3m4 3v-6m4 6V9m3 6v-4" /></>,
    escalas: <><path d="M4 19h4v-4h4v-4h4V7h4" /><circle cx="6" cy="17" r=".8" /><circle cx="10" cy="13" r=".8" /><circle cx="14" cy="9" r=".8" /><circle cx="18" cy="5" r=".8" /></>,
    nota: <><path d="M8.5 3v5a3.5 3.5 0 0 0 7 0V3" /><path d="M12 11.5V21m-3 0h6" /><path d="M4.5 5v3m15-3v3" /></>,
    play: <><path d="M8 21 10.5 4h3L16 21M6.5 21h11" /><path d="m12 13 5-6" /><circle cx="12" cy="13" r="1" /></>,
    teoria: <><path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2Z" /><path d="M12 6v14M7 8h2m-2 3h2m6-3h2m-2 3h2" /></>,
    riffs: <><path d="M12 3.5c3.5 0 7 1.4 7 4.4 0 4.3-4.4 10.8-7 13.1-2.6-2.3-7-8.8-7-13.1 0-3 3.5-4.4 7-4.4Z" /><path d="M13.5 14V7.5l4-1v6.2" /><circle cx="12" cy="14.5" r="1.5" /><circle cx="16" cy="13.5" r="1.5" /></>,
    tablaturas: <><path d="M3.5 4.5h17M3.5 7.5h17M3.5 10.5h17M3.5 13.5h17M3.5 16.5h17M3.5 19.5h17" /><text x="7" y="10" fill="currentColor" stroke="none" fontSize="6" fontWeight="700" textAnchor="middle">3</text><text x="12" y="13" fill="currentColor" stroke="none" fontSize="6" fontWeight="700" textAnchor="middle">5</text><text x="17" y="16" fill="currentColor" stroke="none" fontSize="6" fontWeight="700" textAnchor="middle">7</text></>,
    assistente: <><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4m-5 5h.01M17 13h.01M9 17h6M3 12H1m22 0h-2" /><path d="m19 3 .6 1.4L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.6L19 3Z" /></>,
    busca: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    conta: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9" r="3" /><path d="M6.5 18c1.1-2.2 3-3.3 5.5-3.3s4.4 1.1 5.5 3.3" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3-.5L4 20l1.3-4A7 7 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
    novaConversa: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3-.5L4 20l1.3-4A7 7 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M12 9v6m-3-3h6" /></>,
    lapis: <><path d="m14 5 5 5M4 20l4.5-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" /><path d="M13 6 18 11" /></>,
    olho: <><path d="M2.5 12s3.2-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.2 6.5-9.5 6.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
    grade: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    enviar: <><path d="m3 11 18-8-8 18-2-8-8-2Z" /><path d="m11 13 5-5" /></>,
};

export default function Icone({ nome, tamanho = 22 }) {
    return (
        <svg
            className="icone"
            width={tamanho}
            height={tamanho}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {CAMINHOS[nome] || CAMINHOS.assistente}
        </svg>
    );
}
