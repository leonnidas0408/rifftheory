import { React, useState } from "react";
import IconButton from "./IconButton";

export default function SidebarPages({ pages, defaultPage }) {
    const [page, setPage] = useState(defaultPage);
    const [hidden, setHidden] = useState(true);

    return (
        <div>
            <IconButton label="Toggle" icon="/x.png" onClick={() => setHidden(!hidden)}/>
            <div className={`sidebar${hidden ? " hidden" : ""}`}>
                {
                    Object.entries(pages).map(([key, item]) => (
                        <IconButton onClick={() => setPage(key)} label={key} icon={item[1]} selected={page === key}/>
                    ))
                }
            </div>
            <div style={{
                marginLeft: "155px"
            }}>
                {pages[page][0]}
            </div>
        </div>
    )
}