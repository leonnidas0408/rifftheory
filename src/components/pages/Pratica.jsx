import { useMemo, useState } from "react";
import Barra from "../Barra";
import PrettyPanel from "../PrettyPanel";
import Icone from "../Icone";
import {
  AVANCADO,
  CHAVES,
  ESCALAS_CONTEXTUAIS,
  ESTILOS,
  PROGRESSOES,
  TREINO_OUVIDO,
  VOICINGS,
  arpejoDoAcorde,
  caminhoImproviso,
  gerarHarmonia,
  notasDaEscala,
  sugestoesParaAcorde,
} from "./praticaData";

const FREQUENCIAS = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392,
  "G#": 415.3,
  A: 440,
  "A#": 466.16,
  B: 493.88,
};
const AMOSTRAS_ACORDES = {
  C: "/audio/ccmixter/major-C.wav",
  D: "/audio/ccmixter/major-D.wav",
  E: "/audio/ccmixter/major-E.wav",
  F: "/audio/ccmixter/major-F.wav",
  G: "/audio/ccmixter/major-G.wav",
  A: "/audio/ccmixter/major-A.wav",
  Am: "/audio/ccmixter/minor-A.wav",
  Dm: "/audio/ccmixter/minor-D.wav",
  Em: "/audio/ccmixter/minor-E.wav",
};

function tocarNotas(notas, duracao = 0.85) {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const agora = ctx.currentTime;
  notas.forEach((nome, indice) => {
    const nota = nome.replace(/[0-9]/g, "");
    const oitava = Number(nome.match(/[0-9]+/)?.[0] ?? 4);
    const base = FREQUENCIAS[nota] ?? 261.63;
    const frequencia = base * 2 ** (oitava - 4);
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.0001, agora + indice * 0.08);
    ganho.gain.exponentialRampToValueAtTime(0.18, agora + indice * 0.08 + 0.02);
    ganho.gain.exponentialRampToValueAtTime(
      0.0001,
      agora + indice * 0.08 + duracao,
    );
    osc.connect(ganho).connect(ctx.destination);
    osc.start(agora + indice * 0.08);
    osc.stop(agora + indice * 0.08 + duracao + 0.05);
  });
  window.setTimeout(() => ctx.close(), (duracao + 1) * 1000);
}

function tocarAcorde(acorde) {
  if (typeof window === "undefined") return;
  const amostra =
    AMOSTRAS_ACORDES[acorde] ?? AMOSTRAS_ACORDES[acorde.replace(/7|maj7/g, "")];
  if (!amostra) {
    tocarNotas(
      VOICINGS.find((item) => item.acorde === acorde.replace(/7|maj7/g, ""))
        ?.notas ?? ["C4", "E4", "G4"],
    );
    return;
  }
  const audio = new Audio(amostra);
  audio.volume = 0.9;
  audio
    .play()
    .catch(() =>
      tocarNotas(
        VOICINGS.find((item) => item.acorde === acorde.replace(/7|maj7/g, ""))
          ?.notas ?? ["C4", "E4", "G4"],
      ),
    );
  window.setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 4200);
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="roadmap-section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

export default function Pratica() {
  const [aba, setAba] = useState("começar");
  const [chave, setChave] = useState("C");
  const [acorde, setAcorde] = useState("C");
  const [voicing, setVoicing] = useState(VOICINGS[0]);
  const [escala, setEscala] = useState(ESCALAS_CONTEXTUAIS[0]);
  const [ouvido, setOuvido] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const harmonia = useMemo(() => gerarHarmonia(chave), [chave]);
  const notas = useMemo(
    () => notasDaEscala(chave, escala.tipo),
    [chave, escala],
  );
  const sugestoes = useMemo(() => sugestoesParaAcorde(acorde), [acorde]);
  const caminho = useMemo(() => caminhoImproviso(acorde), [acorde]);
  const arpejo = useMemo(() => arpejoDoAcorde(acorde), [acorde]);
  const audioOuvido = TREINO_OUVIDO[ouvido];

  function escolherAcorde(nome) {
    setAcorde(nome);
    setVoicing(
      VOICINGS.find((item) => item.acorde === nome.replace(/7|maj7/g, "")) ??
        VOICINGS[0],
    );
  }

  function responderOuvido(resposta) {
    const certo = resposta === audioOuvido.resposta;
    setFeedback(
      certo
        ? "Acertou. Confie na sensação da tônica e repita."
        : `Quase. A resposta era ${audioOuvido.resposta}. Tente ouvir a nota mais estável.`,
    );
    setFeedbackType(certo ? "positive" : "negative");
  }

  return (
    <div className="pagina roadmap-page">
      <Barra titulo="Prática" />
      <section className="roadmap-hero">
        <div>
          <span className="eyebrow">Riff Theory · Beta prática</span>
          <h1>Aprenda uma ideia. Ouça. Toque.</h1>
          <p>
            Uma central para sair da consulta e entrar na execução: escolha um
            caminho, experimente o som e avance por módulos.
          </p>
        </div>
        <div className="roadmap-beta">
          <strong>Beta 0.2</strong>
          <span>núcleo de prática aberto</span>
        </div>
      </section>
      <nav className="roadmap-tabs" aria-label="Módulos de prática">
        {[
          ["começar", "Começar"],
          ["harmonia", "Harmonia"],
          ["improviso", "Improviso"],
          ["estilos", "Estilos e timbres"],
          ["ouvido", "Treino de ouvido"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={aba === id ? "ativo" : ""}
            onClick={() => setAba(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {aba === "começar" && (
        <>
        <h2>O que essa trilha treina</h2>
          <PrettyPanel>
            <PrettyPanel>
            <SectionTitle
              eyebrow="Trilha de evolução"
              title="Um passo de cada vez"
            >
              A trilha junta o básico, a aplicação e a especialização sem
              esconder o próximo objetivo.
            </SectionTitle>
            <div className="roadmap-progress">
              <div className="roadmap-progress-line">
                <span style={{ width: "35%" }} />
              </div>
              <div className="roadmap-steps">
                <span className="feito">1 · Formas e som</span>
                <span className="ativo">2 · Harmonia aplicada</span>
                <span>3 · Improviso</span>
                <span>4 · Estilo e timbre</span>
                <span>5 · Ouvido</span>
              </div>
            </div>
          </PrettyPanel>
          
          <section className="roadmap-grid roadmap-grid-3">
            {AVANCADO.map((item) => (
              <article className="roadmap-card" key={item.titulo}>
                <Icone nome="info" tamanho={18} />
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </article>
            ))}
          </section>
          </PrettyPanel>
        <h2>Lições de prática</h2>
          <PrettyPanel>
            <section className="roadmap-grid roadmap-grid-3">
            <article className="roadmap-card destaque">
              <span className="roadmap-number">01</span>
              <h3>Primeiros acordes</h3>
              <p>
                Veja a forma, toque o som e faça a troca em uma progressão
                curta.
              </p>
              <button
                className="link-botao"
                onClick={() => {
                  escolherAcorde("C");
                  setAba("harmonia");
                }}
              >
                Começar por C →
              </button>
            </article>
            <article className="roadmap-card">
              <span className="roadmap-number">02</span>
              <h3>Conectar teoria</h3>
              <p>
                Parta do campo harmônico e descubra quais acordes e escalas
                conversam.
              </p>
              <button className="pilula" onClick={() => setAba("harmonia")}>
                Explorar harmonia
              </button>
            </article>
            <article className="roadmap-card">
              <span className="roadmap-number">03</span>
              <h3>Criar frases</h3>
              <p>
                Use notas-alvo, arpejos e sobreposições para improvisar com
                direção.
              </p>
              <button className="pilula" onClick={() => setAba("improviso")}>
                Guiar improviso
              </button>
            </article>
          </section>
        </PrettyPanel>
        </>
      )}

      {aba === "harmonia" && (
        <>
        <h2>Acordes</h2>
          <PrettyPanel>
            <SectionTitle
              eyebrow="Teoria que vira ação"
              title="Monte uma ideia na tonalidade escolhida"
            >
              O campo harmônico sugere uma sequência; o mapa de escalas mostra
              como continuar tocando sobre ela.
            </SectionTitle>
            <div className="roadmap-controls">
              <label>
                Tonalidade
                <select
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                >
                  {CHAVES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="roadmap-chip-list">
                {harmonia.map((item) => (
                  <button
                    key={item}
                    className={acorde === item ? "selecionado" : ""}
                    onClick={() => escolherAcorde(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="roadmap-suggestion">
              <strong>
                {PROGRESSOES.find((p) => p.acordes[0] === chave)?.nome ??
                  "Progressão sugerida"}
              </strong>
              <span>
                {PROGRESSOES.find((p) => p.acordes[0] === chave)?.contexto ??
                  "Escolha um grau para gerar uma próxima ideia."}
              </span>
            </div>
            <PrettyPanel>
              <h3>Formas alternativas de {acorde}</h3>
              <div className="voicing-list">
                {VOICINGS.filter(
                  (item) =>
                    item.acorde === acorde.replace(/7|maj7/g, "") ||
                    item.acorde === acorde,
                ).map((item) => (
                  <button
                    key={item.nome}
                    className={voicing.nome === item.nome ? "selecionado" : ""}
                    onClick={() => setVoicing(item)}
                  >
                    <strong>{item.nome}</strong>
                    <span>{item.uso}</span>
                    <code>
                      {item.notas
                        .map((n) => n.replace(/[0-9]/g, ""))
                        .join(" · ")}
                    </code>
                  </button>
                ))}
              </div>
              <button
                className="link-botao"
                onClick={() => tocarAcorde(acorde)}
              >
                ▶ Ouvir {voicing.nome}
              </button>
            </PrettyPanel>
          </PrettyPanel>
            <h2>Escala contextual</h2>
          <section className="roadmap-suggestion">
            <PrettyPanel>
              <h3>{escala.nome}</h3>
              <p className="subtitulo">{escala.dica}</p>
              <div className="roadmap-scale-picker">
                {ESCALAS_CONTEXTUAIS.map((item) => (
                  <button
                    key={item.tipo}
                    className={escala.tipo === item.tipo ? "selecionado" : ""}
                    onClick={() => setEscala(item)}
                  >
                    {item.nome}
                    <small>{item.contexto}</small>
                  </button>
                ))}
              </div>
              <p className="roadmap-notes">
                <strong>Notas em {chave}:</strong>{" "}
                {notas.join(" · ") || "Escolha uma escala de sete notas."}
              </p>
              <p>
                <strong>Combina com {acorde}:</strong> {sugestoes.join(" · ")}
              </p>
            </PrettyPanel>
          </section>
        </>
      )}

      {aba === "improviso" && (
        <>
          <PrettyPanel>
            <SectionTitle
              eyebrow="Improvisação guiada"
              title={`Crie uma frase sobre ${acorde}`}
            >
              Comece pelas notas-alvo e conecte-as com a escala. A ideia é dar
              direção sem limitar sua criatividade.
            </SectionTitle>
            <div className="roadmap-controls">
              <label>
                Acorde
                <select
                  value={acorde}
                  onChange={(e) => escolherAcorde(e.target.value)}
                >
                  {["C", "G", "Am", "F", "A7"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button
                className="link-botao"
                onClick={() => tocarAcorde(acorde)}
              >
                ▶ Ouvir base
              </button>
            </div>
            <div className="roadmap-targets">
              {caminho.map((item, index) => (
                <span key={item} className={index === 0 ? "alvo" : ""}>
                  {index + 1}. {item}
                </span>
              ))}
            </div>
          </PrettyPanel>
          <section className="roadmap-two-columns">
            <PrettyPanel>
              <h3>Arpejo de {acorde}</h3>
              <p>
                Toque as notas do acorde em sequência para fazer o ouvido
                reconhecer a harmonia.
              </p>
              <div className="roadmap-note-row">
                {arpejo.map((item) => (
                  <button
                    key={item}
                    onClick={() => tocarNotas([`${item}4`], 0.55)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                className="pilula"
                onClick={() =>
                  tocarNotas(
                    arpejo.map((item) => `${item}4`),
                    0.55,
                  )
                }
              >
                Ouvir arpejo
              </button>
            </PrettyPanel>
            <PrettyPanel>
              <h3>Sobreposições úteis</h3>
              <p>
                Escolha uma cor para sair do desenho básico sem perder o centro
                tonal.
              </p>
              <div className="roadmap-overlay-list">
                <div>
                  <strong>{acorde} →</strong>
                  <span>{sugestoes[0]} para começar</span>
                </div>
                <div>
                  <strong>Mais tensão →</strong>
                  <span>{sugestoes[1]} nas frases de passagem</span>
                </div>
                <div>
                  <strong>Resolver →</strong>
                  <span>volte para a tônica no tempo forte</span>
                </div>
              </div>
            </PrettyPanel>
          </section>
        </>
      )}

      {aba === "estilos" && (
        <>
          <SectionTitle
            eyebrow="Especialização"
            title="O mesmo acorde muda com o contexto"
          >
            Use estilo, timbre e equipamento como escolhas musicais, não como
            uma lista de compras.
          </SectionTitle>
          <section className="roadmap-grid roadmap-grid-2">
            {ESTILOS.map((item) => (
              <article className="roadmap-card estilo-card" key={item.nome}>
                <h3>{item.nome}</h3>
                <p>
                  <strong>Padrão:</strong> {item.padrão}
                </p>
                <p>
                  <strong>Timbre:</strong> {item.timbre}
                </p>
                <p>
                  <strong>Equipamento e pegada:</strong> {item.equipamento}
                </p>
                <button className="pilula" onClick={() => tocarAcorde(acorde)}>
                  Ouvir com a forma atual
                </button>
              </article>
            ))}
          </section>
          <PrettyPanel>
            <h3>Conteúdo avançado por camadas</h3>
            <div className="roadmap-grid roadmap-grid-3">
              {AVANCADO.map((item) => (
                <div key={item.titulo} className="roadmap-mini">
                  <strong>{item.titulo}</strong>
                  <span>{item.texto}</span>
                </div>
              ))}
            </div>
          </PrettyPanel>
        </>
      )}

      {aba === "ouvido" && (
        <>
        <h2>Treine para descobrir o acorde pelo som</h2>
          <PrettyPanel>
            <SectionTitle
              eyebrow="Tirar música de ouvido"
              title="Ouça três notas e encontre a tônica"
            >
              O exercício é local: nenhum áudio é enviado. Toque o exemplo
              quantas vezes quiser, compare e escolha.
            </SectionTitle>
            <div className="ear-training">
              <button
                className="ear-play"
                onClick={() => tocarNotas(audioOuvido.notas, 0.7)}
              >
                ▶ Tocar exemplo
              </button>
              <div className="ear-options">
                {["C", "Am", "G", "F"].map((item) => (
                  <button key={item} onClick={() => responderOuvido(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <p
                className={
                  feedbackType === "positive"
                    ? "sucesso"
                    : "" + feedbackType === "negative"
                      ? " sem-sucesso"
                      : ""
                }
              >
                {feedback || "Escolha uma resposta depois de ouvir."}
              </p>
              <button
                className="pilula"
                onClick={() => {
                  setOuvido((ouvido + 1) % TREINO_OUVIDO.length);
                  setFeedback("");
                  setFeedbackType("");
                }}
              >
                Próximo exemplo
              </button>
            </div>
          </PrettyPanel>
          <section className="roadmap-grid roadmap-grid-3">
            {[
              "Iniciante: reconhecer tônica",
              "Intermediário: reconhecer qualidade",
              "Avançado: descobrir a progressão",
            ].map((item, index) => (
              <article className="roadmap-card" key={item}>
                <span className="roadmap-number">0{index + 1}</span>
                <h3>{item}</h3>
                <p>
                  {index === 0
                    ? "Comece com tríades lentas e cante a nota que parece repousar."
                    : index === 1
                      ? "Compare maior e menor antes de acelerar o exercício."
                      : "Anote os graus e confirme no instrumento depois."}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
