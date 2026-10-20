import React, { useState } from "react";
import SidebarPages from "./SidebarPages";
import IconButton from "./IconButton";

export default function NavbarAdapter({page, setPage, pageData, defaultPage}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return window.localStorage.getItem("riffTheorySidebarOculta") === "true";
        } catch {
            return false;
        }
    });
    function alternarSidebar() {
        setSidebarCollapsed((atual) => {
            const proximo = !atual;
            try {
                window.localStorage.setItem("riffTheorySidebarOculta", String(proximo));
            } catch {
                // A preferência continua funcionando mesmo sem armazenamento local.
            }
            return proximo;
        });
    }
    return (
        <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
            <SidebarPages
                page={page}
                setPage={setPage}
                pageData={pageData}
                defaultPage={defaultPage}
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={alternarSidebar}
            />
            <nav className="bottom-bar" aria-label="Menu de navegação móvel">
                {Object.entries(pageData)
                    .filter(([, item]) => item.icone)
                    .map(([chave, item]) => (
                        <IconButton
                            key={chave}
                            onClick={() => setPage(chave)}
                            label={chave}
                            icon={item.icone}
                            selected={page === chave || (chave === "Início" && page === "Chatbot")}
                        />
                    ))}
            </nav>
        </div>
    )
}
