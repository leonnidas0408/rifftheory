import IconButton from "./IconButton";
import Icone from "./Icone";
import Conteudo from "./Conteudo";

// Seções planejadas: aparecem no menu, mas ainda não têm página.
const EM_BREVE = [
    ["Teoria", "teoria"],
    ["Riffs", "riffs"],
    ["Tabelaturas", "tabelaturas"],
];

export default function SidebarPages({ page, setPage, pageData }) {
    const itens = Object.entries(pageData).filter(
        ([, item]) => item.icone && !item.soMobile
    );

    return (
        <div>
            <aside className="sidebar">
                <div className="sidebar-avatar">
                    <Icone nome="conta" tamanho={56} />
                </div>

                <nav>
                    {itens.map(([chave, item]) => (
                        <IconButton
                            key={chave}
                            onClick={() => setPage(chave)}
                            label={chave}
                            icon={item.icone}
                            selected={page === chave || (chave === "Início" && page === "Chatbot")}
                        />
                    ))}

                    {EM_BREVE.map(([nome, icone]) => (
                        <IconButton key={nome} label={nome} icon={icone} disabled />
                    ))}
                </nav>
            </aside>

            <div className="area-lateral">
                <Conteudo page={page} setPage={setPage} pageData={pageData} />
            </div>
        </div>
    );
}
