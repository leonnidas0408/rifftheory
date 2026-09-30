import React from "react";

// Ícones do layout (traço fino, herdam a cor do texto via currentColor).
const CAMINHOS = {
    inicio: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" stroke="none" />,
    nota: <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" fill="currentColor" strokeWidth="1.6" />,
    escalas: <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" fill="currentColor" strokeWidth="1.6" />,
    teoria: <path d="m2 9 10-5 10 5-10 5zM6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9v6" fill="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
    riffs: (
        <g stroke="none" fill="currentColor">
            <mask id="mask-violao">
                <rect width="24" height="24" fill="#fff" />
                <circle cx="9" cy="15" r="1.5" fill="#000" />
            </mask>
            <g mask="url(#mask-violao)">
                <circle cx="10.7" cy="13.3" r="3.1" />
                <circle cx="7.3" cy="16.7" r="4.6" />
            </g>
            <path d="M11.4 11.4 12.6 12.6 20.1 5.1 18.9 3.9z" />
            <path d="M18.25 3.85 20.55 1.55 22.45 3.45 20.15 5.75z" />
        </g>
    ),
    tabelaturas: <path d="M9 6h12M9 12h12M9 18h12M3.5 5.5 5 5v3M3 11.5h2.5L3 14.5h2.6M3 17.5h2.5v1H3.4m2.1 0v1H3" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    lista: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" fill="none" strokeWidth="2.2" strokeLinecap="round" />,
    play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />,
    busca: <path d="m20 20-4.2-4.2M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" fill="none" strokeWidth="2" strokeLinecap="round" />,
    conta: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM5.8 18.2c1.2-2.2 3.4-3.2 6.2-3.2s5 1 6.2 3.2" fill="none" strokeWidth="1.8" strokeLinecap="round" />,
    chat: <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Z" fill="currentColor" stroke="none" />,
    lapis: <path d="m4 20 1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14.5 6.5l3 3" fill="none" strokeWidth="1.8" strokeLinejoin="round" />,
    olho: <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" strokeWidth="1.8" strokeLinejoin="round" />,
    grade: <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" fill="currentColor" stroke="none" />,
    info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v5.5M12 7.6v.01" fill="none" strokeWidth="2" strokeLinecap="round" />,
    enviar: <path d="M4 12 20 4l-5 16-3-6.5z" fill="currentColor" stroke="none" />,
};

export default function Icone({ nome, tamanho = 22 }) {
    return (
        <svg
            className="icone"
            width={tamanho}
            height={tamanho}
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
        >
            {CAMINHOS[nome]}
        </svg>
    );
}
