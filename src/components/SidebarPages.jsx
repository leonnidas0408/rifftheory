import { React, use, useState } from "react";
import IconButton from "./IconButton";

export default function SidebarPages({ page, setPage, pageData, defaultPage }) {
    const [ hidden, setHidden ] = useState(false);

    return (
        <div>
            <IconButton label="Toggle" icon="/x.png" onClick={() => setHidden(!hidden)}/>
            <div className={`sidebar${hidden ? " hidden" : ""}`}>
                {
                    Object.entries(pageData).map(([key, item]) => (
                        <IconButton onClick={() => setPage(key)} label={key} icon={item.icon} selected={page === key}/>
                    ))
                }
            </div>
            <div style={{
                marginLeft: "155px"
            }}>
                {pageData[page].page}
            </div>
        </div>
    )
}