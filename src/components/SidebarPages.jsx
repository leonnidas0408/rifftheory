import IconButton from "./IconButton";
import Conteudo from "./Conteudo";
import AuthButton from "./AuthButton";
import { GOOGLE_LOGIN_UI_ENABLED } from "../auth/featureFlags";

// Seções planejadas: aparecem no menu, mas ainda não têm página.
const EM_BREVE = [
    ["Teoria", "teoria"],
    ["Riffs", "riffs"],
];

export default function SidebarPages({ page, setPage, pageData, sidebarCollapsed, onToggleSidebar }) {
    const itens = Object.entries(pageData).filter(
        ([, item]) => item.icone && !item.soMobile
    );

    return (
        <div>
            <aside className="sidebar">
                <div className="sidebar-topbar">
                    <a className="brand-lockup" href="#inicio" onClick={(event) => { event.preventDefault(); setPage("Início"); }} aria-label="Riff Theory — início">
                        <span className="brand-mark"><img src="/icon.webp" alt="" title="Riff Theory" width="56" height="56" decoding="async" /></span>
                        <span className="brand-copy"><strong>riff<span>theory</span></strong><small>STUDIO DE GUITARRA</small></span>
                    </a>
                    <button
                        className="sidebar-toggle"
                        type="button"
                        onClick={onToggleSidebar}
                        aria-label="Ocultar barra lateral"
                        title="Ocultar barra lateral"
                    >
                        <span aria-hidden="true" />
                        <span aria-hidden="true" />
                        <span aria-hidden="true" />
                    </button>
                </div>
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
                <Conteudo
                    page={page}
                    setPage={setPage}
                    pageData={pageData}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={onToggleSidebar}
                />
            </div>
        </div>
    );
}
