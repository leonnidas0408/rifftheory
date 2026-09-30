import React from "react";

const W = 64;
const H = 74;
const X0 = 11;
const X1 = 53;
const Y0 = 19;
const Y1 = 69;
const LINHAS = 5;

// Diagrama de acorde em SVG a partir de uma forma { c: [[corda, casa]...] }.
// Cordas que não aparecem em `c` são abafadas (x).
export default function DiagramaAcorde({ forma }) {
    if (!forma) return <div className="diagrama-vazio">sem diagrama</div>;

    const dx = (X1 - X0) / 5;
    const dy = (Y1 - Y0) / LINHAS;
    const xCorda = (corda) => X0 + (6 - corda) * dx;

    const trastes = forma.c.filter(([, casa]) => casa > 0).map(([, casa]) => casa);
    const menor = trastes.length ? Math.min(...trastes) : 1;
    const maior = trastes.length ? Math.max(...trastes) : 1;
    const base = maior <= LINHAS ? 1 : menor;
    const yCasa = (casa) => Y0 + (casa - base + 0.5) * dy;

    // pestana: 3 ou mais cordas na casa mais baixa
    const naPestana = forma.c.filter(([, casa]) => casa === menor && casa > 0);
    const pestana = naPestana.length >= 3 ? naPestana.map(([corda]) => corda) : null;

    return (
        <svg className="diagrama" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true">
            {Array.from({ length: LINHAS + 1 }, (_, r) => (
                <line
                    key={`h${r}`}
                    x1={X0} x2={X1}
                    y1={Y0 + r * dy} y2={Y0 + r * dy}
                    stroke="currentColor"
                    strokeWidth={r === 0 && base === 1 ? 2.6 : 0.9}
                    opacity={r === 0 && base === 1 ? 1 : 0.55}
                />
            ))}

            {[1, 2, 3, 4, 5, 6].map((corda) => (
                <line
                    key={`v${corda}`}
                    x1={xCorda(corda)} x2={xCorda(corda)}
                    y1={Y0} y2={Y1}
                    stroke="currentColor" strokeWidth="0.9" opacity="0.55"
                />
            ))}

            {base > 1 && (
                <text x={W - 1} y={Y0 + dy * 0.75} fontSize="8" textAnchor="end" fill="currentColor">
                    {base}ª
                </text>
            )}

            {pestana && (
                <rect
                    x={xCorda(Math.max(...pestana)) - 3.5}
                    y={yCasa(menor) - 3.5}
                    width={xCorda(Math.min(...pestana)) - xCorda(Math.max(...pestana)) + 7}
                    height="7" rx="3.5" fill="currentColor"
                />
            )}

            {[1, 2, 3, 4, 5, 6].map((corda) => {
                const entrada = forma.c.find(([c]) => c === corda);
                const x = xCorda(corda);

                if (!entrada) {
                    return (
                        <path
                            key={`m${corda}`}
                            d={`M${x - 2.6} 6.4 L${x + 2.6} 11.6 M${x + 2.6} 6.4 L${x - 2.6} 11.6`}
                            stroke="currentColor" strokeWidth="1.1" opacity="0.7"
                        />
                    );
                }
                if (entrada[1] === 0) {
                    return (
                        <circle key={`o${corda}`} cx={x} cy="9" r="2.8"
                            fill="none" stroke="currentColor" strokeWidth="1.1" />
                    );
                }
                return (
                    <circle key={`d${corda}`} cx={x} cy={yCasa(entrada[1])} r="3.6" fill="currentColor" />
                );
            })}
        </svg>
    );
}
