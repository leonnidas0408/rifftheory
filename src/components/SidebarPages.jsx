import { React, use, useState } from "react";
import IconButton from "./IconButton";
import DramaticTitle from "./DramaticTitle";

export default function SidebarPages({ page, setPage, pageData, defaultPage }) {
    const [ hidden, setHidden ] = useState(false);

    return (
        <div>
            <div style={{ position: "fixed", top: "12px", left: "12px", zIndex: 20 }}>
                <IconButton label="Menu" icon="/menu.svg" onClick={() => setHidden(!hidden)}/>
            </div>
            <div className={`sidebar${hidden ? " hidden" : ""}`}>
                <div className="sidebar-logo">
                    <DramaticTitle title="Riff Theory"/>
                </div>
                {
                    Object.entries(pageData).map(([key, item]) => (
                        <IconButton onClick={() => setPage(key)} label={key} icon={item.icon} selected={page === key}/>
                    ))
                }
            </div>
            <div style={{
                marginLeft: hidden ? "0" : "220px"
            }}>
                {pageData[page].page}
            </div>
        </div>
    )
}