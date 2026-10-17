import React, { useState } from "react";
import SidebarPages from "./SidebarPages";
import BottomBar from "./BottomBarPages";
import { isDesktop } from "react-device-detect";

export default function NavbarAdapter({page, setPage, pageData, defaultPage}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            const preference = window.localStorage.getItem("riffTheorySidebarOculta");
            return preference === null ? isDesktop : preference === "true";
        } catch {
            return isDesktop;
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
            {
                isDesktop ?
                <SidebarPages
                    page={page}
                    setPage={setPage}
                    pageData={pageData}
                    defaultPage={defaultPage}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={alternarSidebar}
                />
                : <BottomBar page={page} setPage={setPage} pageData={pageData} defaultPage={defaultPage}/>
            }
        </div>
    )
}
