import React from "react";
import Barra from "../Barra";
import { TAB_CATALOG } from "../../data/tabCatalog";
import "./Tablaturas.css";

export default function Tablaturas() {
    const score = TAB_CATALOG[0];

    return (
        <div className="pagina">
            <Barra titulo="Tablaturas" />
            <section className="pagina-tablaturas" aria-labelledby="titulo-tablaturas">
                <header className="tab-intro">
                    <p className="tab-eyebrow">CATÁLOGO COM FONTE E LICENÇA</p>
                    <h1 id="titulo-tablaturas">Tablaturas completas</h1>
                    <p>
                        Só entram partituras completas cuja fonte e permissão de
                        redistribuição podem ser verificadas. Por enquanto, há uma
                        única edição aprovada.
                    </p>
                </header>

                <article className="tab-score-card" aria-labelledby="menuet-title">
                    <div className="tab-score-heading">
                        <div>
                            <p className="tab-eyebrow">BARROCO · {score.instrument.toUpperCase()}</p>
                            <h2 id="menuet-title">{score.title}</h2>
                            <p className="tab-workline">
                                {score.composer} · {score.catalogueNumber}
                            </p>
                        </div>
                        <span className="tab-page-count">
                            Edição completa · {score.pages} páginas
                        </span>
                    </div>

                    <dl className="tab-metadata">
                        <div>
                            <dt>Instrumento</dt>
                            <dd>{score.arrangement}</dd>
                        </div>
                        <div>
                            <dt>Créditos da fonte</dt>
                            <dd>
                                Typeset por {score.typesetter}; registro enviado por {score.enteredBy}.
                                {" "}{score.sourceRecord}.
                            </dd>
                        </div>
                    </dl>

                    <p className="tab-attribution-note">
                        {score.formerAttribution} O catálogo Bach Digital identifica
                        a obra como de Christian Petzold; a ficha catalográfica está
                        vinculada abaixo. O PDF local permanece inalterado e preserva
                        os créditos e a atribuição impressos na edição original.
                    </p>

                    <div className="tab-license-note">
                        <strong>Licença da edição:</strong> {score.license} O PDF
                        declara também a liberdade de distribuir, modificar e executar
                        esta edição. A cópia local é o arquivo completo da Mutopia,
                        sem alterações.
                    </div>

                    <div className="tab-actions">
                        <a className="tab-action-primary" href={score.pdf} download>
                            Baixar PDF completo
                        </a>
                        <a href={score.sourceUrl} target="_blank" rel="noreferrer">
                            Ficha original da Mutopia
                        </a>
                        <a href={score.lilypond} download>
                            Fonte LilyPond original
                        </a>
                    </div>

                    <div className="tab-pdf-frame">
                        <iframe
                            src={`${score.pdf}#toolbar=1&navpanes=0`}
                            title={`${score.title} — partitura completa de guitarra com tablatura`}
                            loading="lazy"
                        />
                    </div>
                    <p className="tab-pdf-fallback">
                        Se a prévia não abrir no seu navegador, use “Baixar PDF completo”.
                    </p>

                    <footer className="tab-citations" aria-label="Fontes e licença">
                        <span>Verificação:</span>
                        <a href={score.attributionUrl} target="_blank" rel="noreferrer">
                            Bach Digital — autoria e número de catálogo
                        </a>
                        <a href={score.licenseUrl} target="_blank" rel="noreferrer">
                            Mutopia — termos de distribuição
                        </a>
                    </footer>
                </article>

                <p className="tab-catalog-policy">
                    As 30 entradas anteriores foram removidas porque eram arranjos
                    gerados sem partitura completa e fonte específica verificável.
                    Nenhuma outra música protegida ou não verificada aparece neste
                    catálogo.
                </p>
            </section>
        </div>
    );
}
