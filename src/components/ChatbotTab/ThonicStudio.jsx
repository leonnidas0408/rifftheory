import { useMemo, useState } from "react";
import "./ThonicStudio.css";

const STORAGE_KEY = "riffTheoryThonicStudio:v1";
const TAB_STORAGE_KEY = "riff-theory:tabmaker-draft:v1";
const PROGRESSOES = {
  pop: { nome: "Pop essencial", acordes: ["C", "G", "Am", "F"] },
  rock: { nome: "Rock em Mi", acordes: ["Em", "C", "G", "D"] },
  menor: { nome: "Clima menor", acordes: ["Am", "G", "F", "E"] },
};
const FOCO = {
  trocas: {
    nome: "Troca de acordes",
    exercicios: [
      ["Aterrisse no acorde", "Toque cada forma devagar, confira se todas as cordas soam e troque só quando estiver limpo."],
      ["Dois acordes por vez", "Alterne entre os dois primeiros acordes da sequência por um minuto. Repita com o próximo par."],
      ["Ciclo sem pausa", "Toque a progressão completa em loop. Se embolar, reduza o andamento e retome."],
    ],
  },
  ritmo: {
    nome: "Ritmo e precisão",
    exercicios: [
      ["Pulso constante", "Marque quatro tempos por compasso no metrônomo e toque uma vez em cada tempo."],
      ["Acordes no contratempo", "Mantenha o pulso com o pé e ataque os acordes entre os tempos, sem acelerar."],
      ["Dinâmica controlada", "Repita a progressão alternando um compasso leve e outro forte, mantendo o mesmo BPM."],
    ],
  },
  escalas: {
    nome: "Escalas e improviso",
    exercicios: [
      ["Encontre a tônica", "No braço interativo, localize a tônica da tonalidade e diga seu nome antes de tocar."],
      ["Cinco notas, uma frase", "Use a pentatônica menor: crie uma frase curta e termine em uma nota do acorde."],
      ["Pergunta e resposta", "Toque uma frase curta, deixe um compasso de espaço e responda com outra frase."],
    ],
  },
  teoria: {
    nome: "Teoria aplicada",
    exercicios: [
      ["Nomeie os graus", "Leia os acordes da progressão e identifique os graus com ajuda da página Prática."],
      ["Ache notas em comum", "Compare dois acordes vizinhos e encontre uma nota que possa permanecer enquanto você troca."],
      ["Explique o som", "Toque a sequência e descreva qual acorde parece repousar e qual cria mais expectativa."],
    ],
  },
};
function lerPreferencias() {
  try {
    const dado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      foco: FOCO[dado?.foco] ? dado.foco : "trocas",
      nivel: ["iniciante", "intermediario", "avancado"].includes(dado?.nivel) ? dado.nivel : "iniciante",
      minutos: [10, 20, 30].includes(Number(dado?.minutos)) ? Number(dado.minutos) : 20,
      concluidos: dado?.concluidos && typeof dado.concluidos === "object" ? dado.concluidos : {},
    };
  } catch {
    return { foco: "trocas", nivel: "iniciante", minutos: 20, concluidos: {} };
  }
}
function salvarPreferencias(preferencias) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias)); } catch { /* Funciona durante esta sessão sem armazenamento. */ }
}
const NOTAS_CROMATICAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function casaDaNota(nota, cordaAberta) {
  const indiceNota = NOTAS_CROMATICAS.indexOf(nota.replace("m", ""));
  const indiceAberta = NOTAS_CROMATICAS.indexOf(cordaAberta);
  return (indiceNota - indiceAberta + 12) % 12;
}
function criarRascunho(progresso) {
  const notes = Array.from({ length: 6 }, () => Array(8).fill(""));
  progresso.acordes.forEach((acorde, indice) => {
    const inicio = indice * 2;
    const raiz = acorde.replace("m", "");
    const raizIndice = NOTAS_CROMATICAS.indexOf(raiz);
    const quinta = NOTAS_CROMATICAS[(raizIndice + 7) % NOTAS_CROMATICAS.length];
    notes[5][inicio] = String(casaDaNota(raiz, "E"));
    notes[4][inicio + 1] = String(casaDaNota(quinta, "A"));
  });
  return { title: `Base · ${progresso.nome}`, tuning: "standard", notes };
}

export default function ThonicStudio({ onAskThonic, onOpenTabMaker, onOpenFretboard, onOpenPractice }) {
  const [preferencias, setPreferencias] = useState(lerPreferencias);
  const [aberto, setAberto] = useState(true);
  const [progressoSelecionado, setProgressoSelecionado] = useState("pop");
  const foco = FOCO[preferencias.foco];
  const exercicios = useMemo(() => {
    const distribuicao = Math.max(2, Math.round(preferencias.minutos / foco.exercicios.length));
    return foco.exercicios.map(([titulo, descricao], indice) => ({
      titulo,
      descricao: preferencias.nivel === "avancado" ? `${descricao} Para aprofundar: varie a articulação e compare duas soluções musicais.` : descricao,
      minutos: indice === foco.exercicios.length - 1 ? preferencias.minutos - distribuicao * (foco.exercicios.length - 1) : distribuicao,
      id: `${preferencias.foco}-${indice}`,
    }));
  }, [foco, preferencias.foco, preferencias.minutos, preferencias.nivel]);
  function atualizar(campo, valor) {
    setPreferencias((atual) => {
      const proxima = { ...atual, [campo]: valor };
      salvarPreferencias(proxima);
      return proxima;
    });
  }
  function alternarExercicio(id) {
    const concluidos = { ...preferencias.concluidos, [id]: !preferencias.concluidos[id] };
    atualizar("concluidos", concluidos);
  }
  function gerarGuiaComThonic() {
    const texto = `Crie um guia personalizado de prática de guitarra/violão em português do Brasil. Use os módulos e recursos existentes do Riff Theory: acordes e braço interativo, escalas, harmonia, metrônomo, tablaturas e prática guiada. Nível: ${preferencias.nivel}. Dificuldade principal: ${foco.nome}. Tempo disponível: ${preferencias.minutos} minutos. Organize em 3 exercícios curtos com duração, instrução concreta, critério para avançar e uma sugestão de como revisar a dificuldade. Evite prometer resultados ou inventar ferramentas do site. Se sugerir acordes, use a progressão ${PROGRESSOES[progressoSelecionado].acordes.join(" – ")}.`;
    onAskThonic(texto);
  }
  function abrirTablatura() {
    const progresso = PROGRESSOES[progressoSelecionado];
    try { localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(criarRascunho(progresso))); } catch { /* O editor abre vazio se o navegador bloquear o armazenamento. */ }
    onOpenTabMaker();
  }
  function imprimirGuia() {
    document.body.classList.add("thonic-print-mode");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove("thonic-print-mode"), 500);
    }, 50);
  }
  return (
    <section className="thonic-studio" aria-labelledby="thonic-studio-title">
      <div className="thonic-studio-head">
        <div>
          <span className="eyebrow">THonic · FERRAMENTAS DE PRÁTICA</span>
          <h2 id="thonic-studio-title">Transforme uma dificuldade em próximos passos.</h2>
          <p>Monte um guia no seu ritmo, leve uma base para a tablatura ou abra o braço do instrumento. Preferências e progresso ficam neste navegador.</p>
        </div>
        <button type="button" className="thonic-studio-toggle" onClick={() => setAberto((valor) => !valor)} aria-expanded={aberto}>{aberto ? "Recolher" : "Abrir ferramentas"}</button>
      </div>
      {aberto && <>
        <div className="thonic-studio-form">
          <label>Quero melhorar em
            <select value={preferencias.foco} onChange={(event) => atualizar("foco", event.target.value)}>
              {Object.entries(FOCO).map(([id, item]) => <option key={id} value={id}>{item.nome}</option>)}
            </select>
          </label>
          <label>Nível
            <select value={preferencias.nivel} onChange={(event) => atualizar("nivel", event.target.value)}>
              <option value="iniciante">Começando</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option>
            </select>
          </label>
          <label>Tempo de prática
            <select value={preferencias.minutos} onChange={(event) => atualizar("minutos", Number(event.target.value))}>
              <option value={10}>10 minutos</option><option value={20}>20 minutos</option><option value={30}>30 minutos</option>
            </select>
          </label>
        </div>
        <div className="thonic-studio-actions">
          <button type="button" className="thonic-action-primary" onClick={gerarGuiaComThonic}>Criar guia com Thonic</button>
          <button type="button" onClick={imprimirGuia}>Imprimir / salvar guia em PDF</button>
          <button type="button" onClick={onOpenFretboard}>Abrir braço interativo</button>
          <button type="button" onClick={onOpenPractice}>Explorar Prática</button>
        </div>
        <div className="thonic-studio-tab">
          <div>
            <span className="eyebrow">BASE DE TABLATURA</span>
            <h3>Comece com uma progressão conhecida</h3>
            <p>O Thonic prepara um esboço editável no Criador de Tablaturas. Confira e ajuste as casas antes de usar.</p>
          </div>
          <label className="thonic-progression">Progressão
            <select value={progressoSelecionado} onChange={(event) => setProgressoSelecionado(event.target.value)}>
              {Object.entries(PROGRESSOES).map(([id, item]) => <option key={id} value={id}>{item.nome} · {item.acordes.join(" – ")}</option>)}
            </select>
          </label>
          <button type="button" className="thonic-action-primary" onClick={abrirTablatura}>Preparar base no editor</button>
        </div>
        <section className="thonic-workout-sheet" aria-labelledby="thonic-workout-title">
          <div className="thonic-sheet-heading">
            <div><span className="eyebrow">GUIA PERSONALIZADO · {preferencias.minutos} MIN</span><h3 id="thonic-workout-title">Treino de {foco.nome.toLowerCase()}</h3><p>{preferencias.nivel === "iniciante" ? "Começando" : preferencias.nivel === "intermediario" ? "Intermediário" : "Avançado"} · progrida sem pressa e marque cada etapa ao concluir.</p></div>
            <span className="thonic-sheet-badge">{exercicios.filter((item) => preferencias.concluidos[item.id]).length}/{exercicios.length} feitos</span>
          </div>
          <div className="thonic-workout-list">
            {exercicios.map((item, indice) => <label className={`thonic-workout-item${preferencias.concluidos[item.id] ? " concluido" : ""}`} key={item.id}>
              <input type="checkbox" checked={!!preferencias.concluidos[item.id]} onChange={() => alternarExercicio(item.id)} />
              <span className="thonic-workout-number">0{indice + 1}</span>
              <span className="thonic-workout-copy"><strong>{item.titulo}</strong><span>{item.descricao}</span><small>{item.minutos} min</small></span>
            </label>)}
          </div>
          <p className="thonic-sheet-note">Ajuste o andamento para manter o controle. Se doer ou ficar tenso, pare e retome mais devagar.</p>
        </section>
      </>}
    </section>
  );
}
