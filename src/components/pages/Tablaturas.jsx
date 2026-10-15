import { useEffect, useMemo, useRef, useState } from "react";
import Barra from "../Barra";
import "./TabMaker.css";

const STORAGE_KEY = "riff-theory:tabmaker-draft:v1";
const POSICOES_POR_COMPASSO = 8;
const NOMES_CORDAS = ["e", "B", "G", "D", "A", "E"];
const TECNICAS = [
    { token: "h", nome: "Hammer-on" },
    { token: "p", nome: "Pull-off" },
    { token: "b", nome: "Bend" },
    { token: "r", nome: "Release" },
    { token: "~", nome: "Vibrato" },
    { token: "/", nome: "Slide up" },
    { token: "\\", nome: "Slide down" },
    { token: "t", nome: "Tapping" },
    { token: "x", nome: "Abafada" },
];
const AFINACOES = {
    standard: {
        label: "Padrão · E A D G B E",
        nomes: ["E4", "B3", "G3", "D3", "A2", "E2"],
    },
    dropD: {
        label: "Drop D · D A D G B E",
        nomes: ["E4", "B3", "G3", "D3", "A2", "D2"],
    },
    halfStep: {
        label: "Meio tom abaixo · Eb Ab Db Gb Bb Eb",
        nomes: ["Eb4", "Bb3", "Gb3", "Db3", "Ab2", "Eb2"],
    },
};

function validarNotacao(valor) {
    const texto = String(valor ?? "").toLowerCase();
    if (texto === "") return true;
    if (texto === "x") return true;
    if (!/^\d{1,2}(?:[hpbr]\d{0,2}|~|[\\/]\d{0,2}|t)*$/.test(texto)) return false;

    const casas = texto.match(/\d+/g) || [];
    return casas.every((casa) => Number(casa) <= 24);
}

function criarGrade(colunas = POSICOES_POR_COMPASSO) {
    return Array.from({ length: 6 }, () => Array(colunas).fill(""));
}

function rascunhoVazio() {
    return { title: "", tuning: "standard", notes: criarGrade() };
}

function lerRascunho() {
    if (typeof window === "undefined") return rascunhoVazio();

    try {
        const salvo = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
        if (!salvo || !Array.isArray(salvo.notes) || salvo.notes.length !== 6) return rascunhoVazio();

        const colunas = salvo.notes[0]?.length;
        if (!Number.isInteger(colunas) || colunas < POSICOES_POR_COMPASSO || colunas > 128 || colunas % POSICOES_POR_COMPASSO !== 0) {
            return rascunhoVazio();
        }

        const notes = salvo.notes.map((linha) => {
            if (!Array.isArray(linha) || linha.length !== colunas) return null;
            return linha.map((valor) => {
                const texto = String(valor ?? "").toLowerCase();
                return validarNotacao(texto) ? texto : "";
            });
        });
        if (notes.some((linha) => !linha)) return rascunhoVazio();

        return {
            title: typeof salvo.title === "string" ? salvo.title.slice(0, 80) : "",
            tuning: Object.hasOwn(AFINACOES, salvo.tuning) ? salvo.tuning : "standard",
            notes,
        };
    } catch {
        return rascunhoVazio();
    }
}

function formatarPosicao(nota, largura) {
    if (!nota) return "-".repeat(largura);

    const sobra = Math.max(0, largura - nota.length);
    const esquerda = Math.floor(sobra / 2);
    return `${"-".repeat(esquerda)}${nota}${"-".repeat(sobra - esquerda)}`;
}

function gerarTablatura(rascunho) {
    const afinacao = AFINACOES[rascunho.tuning] || AFINACOES.standard;
    const titulo = rascunho.title.trim() || "Sem título";
    const cabecalho = `${titulo}\nAfinação: ${afinacao.label}\n`;
    const larguras = rascunho.notes[0].map((_, posicao) => {
        const maiorNotacao = Math.max(0, ...rascunho.notes.map((linha) => (linha[posicao] || "").length));
        return Math.max(4, maiorNotacao + 2);
    });
    const linhas = rascunho.notes.map((notas, indice) => {
        const compassos = [];
        for (let inicio = 0; inicio < notas.length; inicio += POSICOES_POR_COMPASSO) {
            const grupo = notas.slice(inicio, inicio + POSICOES_POR_COMPASSO);
            compassos.push(grupo.map((nota, deslocamento) => formatarPosicao(nota, larguras[inicio + deslocamento])).join(""));
        }
        return `${NOMES_CORDAS[indice]}|${compassos.join("|")}|`;
    });
    return `${cabecalho}\n${linhas.join("\n")}`;
}

function nomeArquivo(titulo) {
    const base = titulo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return `${base || "tablatura"}.txt`;
}

export default function Tablaturas() {
    const [rascunho, setRascunho] = useState(lerRascunho);
    const [status, setStatus] = useState("O rascunho fica salvo neste navegador; não é sincronizado entre dispositivos.");
    const [celulaAtiva, setCelulaAtiva] = useState(null);
    const referenciasInputs = useRef(new Map());
    const colunas = rascunho.notes[0]?.length || POSICOES_POR_COMPASSO;
    const quantidadeCompassos = colunas / POSICOES_POR_COMPASSO;
    const textoTab = useMemo(() => gerarTablatura(rascunho), [rascunho]);
    const afinacao = AFINACOES[rascunho.tuning] || AFINACOES.standard;

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rascunho));
            setStatus("Rascunho salvo neste navegador; não é sincronizado entre dispositivos.");
        } catch {
            setStatus("O armazenamento local está indisponível. Use Copiar ou Baixar para não perder sua tablatura.");
        }
    }, [rascunho]);

    function atualizar(campo, valor) {
        setRascunho((atual) => ({ ...atual, [campo]: valor }));
    }

    function atualizarNota(corda, posicao, valor) {
        const texto = String(valor ?? "").toLowerCase();
        if (!validarNotacao(texto)) {
            const casas = texto.match(/\d+/g) || [];
            if (casas.some((casa) => Number(casa) > 24)) {
                setStatus("Use casas entre 0 e 24. Revise também os números de destino de bends, releases e slides.");
            } else {
                setStatus("Notação inválida. Use, por exemplo, 5h7, 7p5, 7b9r7, 7~ ou 5/7.");
            }
            return;
        }

        setRascunho((atual) => ({
            ...atual,
            notes: atual.notes.map((linha, indice) => (
                indice === corda ? linha.map((nota, coluna) => (coluna === posicao ? texto : nota)) : linha
            )),
        }));
    }

    function inserirTecnica(token) {
        if (!celulaAtiva) {
            setStatus("Clique em uma posição da grade antes de inserir um marcador.");
            return;
        }

        const { corda, posicao } = celulaAtiva;
        const notaAtual = rascunho.notes[corda]?.[posicao];
        const input = referenciasInputs.current.get(`${corda}-${posicao}`);
        if (typeof notaAtual !== "string") {
            setCelulaAtiva(null);
            setStatus("Selecione uma posição disponível na grade.");
            return;
        }

        if (token === "x") {
            atualizarNota(corda, posicao, "x");
            requestAnimationFrame(() => input?.focus());
            return;
        }

        if (!notaAtual || !/\d/.test(notaAtual)) {
            setStatus("Digite primeiro a casa inicial; depois insira o marcador e a casa de destino, se houver.");
            input?.focus();
            return;
        }

        const inicio = input?.selectionStart ?? notaAtual.length;
        const fim = input?.selectionEnd ?? inicio;
        const proximaNota = `${notaAtual.slice(0, inicio)}${token}${notaAtual.slice(fim)}`;
        if (!validarNotacao(proximaNota)) {
            setStatus("Esse marcador não cabe nessa posição. Revise a sequência da notação.");
            input?.focus();
            return;
        }

        atualizarNota(corda, posicao, proximaNota);
        requestAnimationFrame(() => {
            input?.focus();
            const cursor = inicio + token.length;
            input?.setSelectionRange(cursor, cursor);
        });
    }

    function adicionarCompasso() {
        setRascunho((atual) => ({
            ...atual,
            notes: atual.notes.map((linha) => [...linha, ...Array(POSICOES_POR_COMPASSO).fill("")]),
        }));
    }

    function removerCompasso() {
        if (quantidadeCompassos <= 1) return;
        setRascunho((atual) => ({
            ...atual,
            notes: atual.notes.map((linha) => linha.slice(0, -POSICOES_POR_COMPASSO)),
        }));
    }

    async function copiarTablatura() {
        try {
            await navigator.clipboard.writeText(textoTab);
            setStatus("Tablatura copiada para a área de transferência.");
        } catch {
            setStatus("Não foi possível copiar automaticamente. Selecione o texto da prévia ou baixe o arquivo.");
        }
    }

    function baixarTablatura() {
        const arquivo = new Blob([textoTab], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement("a");
        link.href = url;
        link.download = nomeArquivo(rascunho.title);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus("Arquivo de tablatura baixado.");
    }

    return (
        <div className="pagina tabmaker-page">
            <Barra titulo="Criador de Tablaturas" />

            <header className="tabmaker-heading">
                <span className="eyebrow">EDITOR DE TABLATURA</span>
                <h1>Escreva sua própria tab</h1>
                <p>Edite as casas nas seis cordas. Cada compasso tem oito posições; notas simultâneas na mesma coluna formam acordes. O editor não gera nem atribui tablaturas automaticamente.</p>
            </header>

            <section className="tabmaker-settings" aria-label="Identificação da tablatura">
                <label>
                    Título
                    <input
                        type="text"
                        maxLength={80}
                        value={rascunho.title}
                        onChange={(event) => atualizar("title", event.target.value)}
                        placeholder="Ex.: riff em Mi menor"
                    />
                </label>
                <label>
                    Afinação
                    <select value={rascunho.tuning} onChange={(event) => atualizar("tuning", event.target.value)}>
                        {Object.entries(AFINACOES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
                    </select>
                </label>
            </section>

            <section className="tabmaker-editor" aria-labelledby="tabmaker-editor-title">
                <div className="tabmaker-toolbar">
                    <div>
                        <h2 id="tabmaker-editor-title">Grade de tablatura</h2>
                        <p>{quantidadeCompassos} {quantidadeCompassos === 1 ? "compasso" : "compassos"} · cordas da mais aguda para a mais grave</p>
                    </div>
                    <div className="tabmaker-actions">
                        <button className="tabmaker-button tabmaker-button-secondary" type="button" onClick={removerCompasso} disabled={quantidadeCompassos <= 1}>
                            Remover compasso
                        </button>
                        <button className="tabmaker-button tabmaker-button-primary" type="button" onClick={adicionarCompasso}>
                            + Compasso
                        </button>
                    </div>
                </div>

                <div className="tabmaker-techniques" role="group" aria-label="Marcadores de técnicas de guitarra">
                    <div className="tabmaker-techniques-heading">
                        <strong>Técnicas rápidas</strong>
                        <span>Selecione uma casa na grade; o marcador será inserido no ponto do cursor.</span>
                    </div>
                    <div className="tabmaker-technique-list">
                        {TECNICAS.map(({ token, nome }) => (
                            <button
                                className="tabmaker-technique-button"
                                type="button"
                                key={token}
                                aria-label={`${nome}, marcador ${token}`}
                                title={`${nome} (${token})`}
                                onPointerDown={(event) => event.preventDefault()}
                                onClick={() => inserirTecnica(token)}
                            >
                                <code>{token}</code>
                                <span>{nome}</span>
                            </button>
                        ))}
                    </div>
                    <p className="tabmaker-techniques-examples">Exemplos: <code>5h7</code> (hammer-on), <code>7p5</code> (pull-off), <code>7b9r7</code> (bend e release), <code>7~</code> (vibrato), <code>5/7</code> e <code>7\5</code> (slides), <code>12t</code> (tapping) e <code>x</code> (nota abafada).</p>
                </div>

                <p className="tabmaker-scroll-hint">Em telas estreitas, deslize a grade para os lados para acessar todas as posições.</p>
                <div className="tabmaker-grid-wrap" role="region" aria-label="Grade editável de seis cordas" tabIndex="0">
                    <table className="tabmaker-grid">
                        <thead>
                            <tr>
                                <th scope="col" className="tabmaker-string-heading">Corda</th>
                                {Array.from({ length: colunas }, (_, posicao) => (
                                    <th
                                        scope="col"
                                        className={posicao % POSICOES_POR_COMPASSO === 0 ? "tabmaker-measure-start" : ""}
                                        key={posicao}
                                        aria-label={`Compasso ${Math.floor(posicao / POSICOES_POR_COMPASSO) + 1}, posição ${posicao % POSICOES_POR_COMPASSO + 1}`}
                                    >
                                        {posicao % POSICOES_POR_COMPASSO + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {NOMES_CORDAS.map((nome, corda) => (
                                <tr key={nome}>
                                    <th scope="row" className="tabmaker-string-heading">
                                        <span>{nome}</span>
                                        <small>{afinacao.nomes[corda]}</small>
                                    </th>
                                    {rascunho.notes[corda].map((nota, posicao) => (
                                        <td className={posicao % POSICOES_POR_COMPASSO === 0 ? "tabmaker-measure-start" : ""} key={posicao}>
                                            <input
                                                ref={(elemento) => {
                                                    const chave = `${corda}-${posicao}`;
                                                    if (elemento) referenciasInputs.current.set(chave, elemento);
                                                    else referenciasInputs.current.delete(chave);
                                                }}
                                                type="text"
                                                inputMode="text"
                                                maxLength={12}
                                                value={nota}
                                                onFocus={() => setCelulaAtiva({ corda, posicao })}
                                                onChange={(event) => atualizarNota(corda, posicao, event.target.value)}
                                                aria-label={`${nome}, ${afinacao.nomes[corda]}, compasso ${Math.floor(posicao / POSICOES_POR_COMPASSO) + 1}, posição ${posicao % POSICOES_POR_COMPASSO + 1}; notação de casa e técnica, como 5h7 ou 7b9r7`}
                                                autoComplete="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="tabmaker-guidance">Cada célula aceita uma casa ou uma expressão com técnica. Use casas de <strong>0 a 24</strong>; deixe em branco para não tocar a corda. Expressões como <code>7b9r7</code> mantêm bend e release alinhados em todas as cordas na prévia.</p>
            </section>

            <section className="tabmaker-output" aria-labelledby="tabmaker-output-title">
                <div className="tabmaker-toolbar">
                    <div>
                        <h2 id="tabmaker-output-title">Prévia em texto</h2>
                        <p>Formato simples de tablatura, pronto para copiar ou salvar.</p>
                    </div>
                    <div className="tabmaker-actions">
                        <button className="tabmaker-button tabmaker-button-secondary" type="button" onClick={copiarTablatura}>Copiar</button>
                        <button className="tabmaker-button tabmaker-button-primary" type="button" onClick={baixarTablatura}>Baixar .txt</button>
                    </div>
                </div>
                <pre className="tabmaker-preview" aria-label="Prévia textual da tablatura">{textoTab}</pre>
            </section>

            <p className="tabmaker-status" role="status" aria-live="polite">{status}</p>
        </div>
    );
}
