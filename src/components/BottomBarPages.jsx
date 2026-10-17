import React, { useRef, useState } from "react";
import IconButton from "./IconButton";
import Conteudo from "./Conteudo";

export default function BottomBar({ page, setPage, pageData }) {
    const barraRef = useRef(null);
    const arrasteRef = useRef(null);
    const bloquearCliqueRef = useRef(false);
    const [arrastando, setArrastando] = useState(false);

    function iniciarArraste(evento) {
        if (!barraRef.current) return;
        arrasteRef.current = {
            ponteiro: evento.pointerId,
            inicioX: evento.clientX,
            scrollInicial: barraRef.current.scrollLeft,
            moveu: false,
        };
        barraRef.current.setPointerCapture?.(evento.pointerId);
    }

    function moverMenu(evento) {
        const arraste = arrasteRef.current;
        if (!arraste || !barraRef.current || arraste.ponteiro !== evento.pointerId) return;
        const deslocamento = evento.clientX - arraste.inicioX;
        if (Math.abs(deslocamento) < 4) return;
        arraste.moveu = true;
        setArrastando(true);
        barraRef.current.scrollLeft = arraste.scrollInicial - deslocamento;
    }

    function finalizarArraste(evento) {
        const arraste = arrasteRef.current;
        if (!arraste || arraste.ponteiro !== evento.pointerId) return;
        bloquearCliqueRef.current = arraste.moveu;
        arrasteRef.current = null;
        setArrastando(false);
        barraRef.current?.releasePointerCapture?.(evento.pointerId);
        if (bloquearCliqueRef.current) {
            window.setTimeout(() => { bloquearCliqueRef.current = false; }, 0);
        }
    }

    function impedirCliqueDepoisDoArraste(evento) {
        if (!bloquearCliqueRef.current) return;
        evento.preventDefault();
        evento.stopPropagation();
    }

    return (
        <div>
            <Conteudo page={page} setPage={setPage} pageData={pageData} />

            <div
                ref={barraRef}
                className={`bottom-bar${arrastando ? " arrastando" : ""}`}
                onPointerDown={iniciarArraste}
                onPointerMove={moverMenu}
                onPointerUp={finalizarArraste}
                onPointerCancel={finalizarArraste}
                onClickCapture={impedirCliqueDepoisDoArraste}
                aria-label="Menu de navegação móvel; arraste para ver mais opções"
            >
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
