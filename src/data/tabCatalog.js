export const TAB_CATALOG = [
    {
        id: "menuet-in-g-mutopia-695",
        title: "Menuet in G",
        composer: "Christian Petzold (1677–1733)",
        formerAttribution: "A edição Mutopia ainda conserva a atribuição histórica a Johann Sebastian Bach.",
        catalogueNumber: "BWV Anh. 114",
        instrument: "Guitarra",
        arrangement: "Edição para guitarra com notação e tablatura",
        typesetter: "Yannick Kirschhoffer",
        enteredBy: "Emre Akbas",
        source: "Mutopia Project",
        sourceRecord: "Mutopia-2013/01/06-695",
        pages: 2,
        license: "Domínio público, conforme declaração do typesetter no PDF original.",
        pdf: "/tablaturas/menuet-in-g-bwv-anh-114-guitar-mutopia.pdf",
        lilypond: "/tablaturas/menuet-in-g-bwv-anh-114-guitar-mutopia.ly",
        sourceUrl: "https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=695",
        licenseUrl: "https://www.mutopiaproject.org/legal.html",
        attributionUrl: "https://www.bach-digital.de/receive/BachDigitalWork_work_00001424",
    },
];

export function buscarNoCatalogo(query = "") {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return TAB_CATALOG;
    const terms = normalized.split(/\s+/).filter(Boolean);
    return TAB_CATALOG.filter((item) => {
        const searchable = [
            item.title,
            item.composer,
            item.formerAttribution,
            item.catalogueNumber,
            item.instrument,
            item.source,
            item.sourceRecord,
        ].join(" ").toLocaleLowerCase("pt-BR");
        return terms.every((term) => searchable.includes(term));
    });
}
