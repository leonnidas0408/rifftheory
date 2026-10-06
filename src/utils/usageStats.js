// src/utils/usageStats.js
// Rastreamento local de tempo de uso do Riff Theory, usado pelo gráfico
// "Semanas de uso" da Home. Não depende de backend: os minutos de uso são
// acumulados por dia no localStorage do navegador. Conta apenas enquanto a
// aba está visível (document.visibilityState === "visible"), evitando
// contar tempo em segundo plano.

const CHAVE_ARMAZENAMENTO = "riffTheoryUsoSemanal";
const INTERVALO_MS = 15000; // grava a cada 15s de uso ativo
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function lerArmazenamento() {
    try {
        const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
        return bruto ? JSON.parse(bruto) : {};
    } catch {
        return {};
    }
}

function gravarArmazenamento(dados) {
    try {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dados));
    } catch {
        // localStorage indisponível (modo privado, quota etc.) — falha silenciosa
    }
}

function chaveDoDia(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

/** Soma `minutos` ao total do dia informado (padrão: hoje). */
export function registrarUsoMinutos(minutos, data = new Date()) {
    const dados = lerArmazenamento();
    const chave = chaveDoDia(data);
    dados[chave] = (dados[chave] || 0) + minutos;
    gravarArmazenamento(dados);
}

/**
 * Retorna os últimos 7 dias (hoje incluso), do mais antigo pro mais
 * recente, no formato usado pelo gráfico da Home.
 * @returns {Array<{ label: string, minutos: number }>}
 */
export function obterUsoSemanal() {
    const dados = lerArmazenamento();
    const hoje = new Date();
    const dias = [];

    for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        const chave = chaveDoDia(data);

        dias.push({
            label: DIAS_SEMANA[data.getDay()],
            minutos: dados[chave] || 0,
        });
    }

    return dias;
}

/** Total de horas de uso nos últimos 7 dias. */
export function obterTotalHorasSemana() {
    const totalMinutos = obterUsoSemanal().reduce((soma, d) => soma + d.minutos, 0);
    return totalMinutos / 60;
}

/**
 * Inicia o rastreamento de uso (chamar uma vez, ex: useEffect em App.jsx).
 * Retorna uma função de limpeza que interrompe o rastreamento.
 */
export function iniciarRastreioDeUso() {
    const intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
            registrarUsoMinutos(INTERVALO_MS / 60000);
        }
    }, INTERVALO_MS);

    return function pararRastreioDeUso() {
        clearInterval(intervalId);
    };
}

// ---------------------------------------------------------------------------
// Eventos do funil da primeira sessão (Fase 0 do plano de melhoria).
// Ficam no localStorage (sem backend) e também são emitidos como CustomEvent
// "rt:evento", para que uma ferramenta de analytics possa se plugar depois.
// Eventos: home_viewed, hero_cta_clicked, search_started, search_submitted,
// result_opened, fretboard_note_clicked, chord_selected, first_value_reached,
// next_step_clicked, session_completed, return_session_opened.
// ---------------------------------------------------------------------------

const CHAVE_EVENTOS = "riffTheoryEventos";
const MAX_EVENTOS = 500;
const DIA_MS = 24 * 60 * 60 * 1000;

function lerEventos() {
    try {
        const bruto = localStorage.getItem(CHAVE_EVENTOS);
        return bruto ? JSON.parse(bruto) : [];
    } catch {
        return [];
    }
}

/**
 * Registra um evento do funil. Com `umaVezPorSessao`, ignora repetições na
 * mesma aba (útil para first_value_reached e session_completed).
 * @returns {boolean} true se o evento foi registrado.
 */
export function registrarEvento(nome, dados = {}, { umaVezPorSessao = false } = {}) {
    if (umaVezPorSessao) {
        try {
            const marca = `rt-evento-${nome}`;
            if (sessionStorage.getItem(marca)) return false;
            sessionStorage.setItem(marca, "1");
        } catch {
            // sessionStorage indisponível — registra mesmo assim
        }
    }

    const evento = { nome, t: Date.now(), ...dados };

    try {
        const lista = [...lerEventos(), evento].slice(-MAX_EVENTOS);
        localStorage.setItem(CHAVE_EVENTOS, JSON.stringify(lista));
    } catch {
        // localStorage indisponível — falha silenciosa
    }

    window.dispatchEvent(new CustomEvent("rt:evento", { detail: evento }));
    return true;
}

/**
 * Resumo da semana para o bloco "Progresso desta semana" da Home.
 * `sequencia` conta dias seguidos (até hoje ou ontem) com alguma descoberta.
 */
export function obterProgressoSemana() {
    const eventos = lerEventos();
    const corte = Date.now() - 7 * DIA_MS;
    const semana = eventos.filter((e) => e.t >= corte);
    const contar = (nome) => semana.filter((e) => e.nome === nome).length;

    const diasAtivos = new Set(
        eventos
            .filter((e) => e.nome === "chord_selected" || e.nome === "result_opened")
            .map((e) => chaveDoDia(new Date(e.t)))
    );
    let sequencia = 0;
    const dia = new Date();
    if (!diasAtivos.has(chaveDoDia(dia))) dia.setDate(dia.getDate() - 1);
    while (diasAtivos.has(chaveDoDia(dia))) {
        sequencia++;
        dia.setDate(dia.getDate() - 1);
    }

    const ultimo = [...eventos].reverse().find((e) => e.nome === "chord_selected");

    return {
        acordes: contar("chord_selected"),
        musicas: contar("result_opened"),
        sessoes: contar("session_completed"),
        sequencia,
        ultimoAcorde: ultimo?.acorde ?? null,
    };
}
