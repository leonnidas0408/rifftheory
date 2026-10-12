import IconButton from "./IconButton";
import Conteudo from "./Conteudo";
import AuthButton from "./AuthButton";
import { GOOGLE_LOGIN_UI_ENABLED } from "../auth/featureFlags";

// Seções planejadas: aparecem no menu, mas ainda não têm página.
const EM_BREVE = [
    ["Teoria", "teoria"],
    ["Riffs", "riffs"],
    ["Tablaturas", "tablaturas"],
];

export default function SidebarPages({ page, setPage, pageData }) {
    const itens = Object.entries(pageData).filter(
        ([, item]) => item.icone && !item.soMobile
    );

    return (
        <div>
            <aside className="sidebar">
                <a className="brand-lockup" href="#inicio" onClick={(event) => { event.preventDefault(); setPage("Início"); }} aria-label="Riff Theory — início">
                    <span className="brand-mark"><img src="/icon.jpg" alt="" /></span>
                    <span className="brand-copy"><strong>riff<span>theory</span></strong><small>STUDIO DE GUITARRA</small></span>
                </a>
                {GOOGLE_LOGIN_UI_ENABLED && (
                    <div className="sidebar-avatar">
                        <AuthButton />
                    </div>
                )}

                <nav aria-label="Navegação principal">
                    <span className="nav-caption">SEU ESPAÇO</span>
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
                <div className="sidebar-footnote"><span className="status-dot" /> Sua prática, no seu ritmo</div>
            </aside>

            <div className="area-lateral">
                <Conteudo page={page} setPage={setPage} pageData={pageData} />
            </div>
        </div>
    );
}
