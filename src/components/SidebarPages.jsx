import { React, useState } from "react";
import IconButton from "./IconButton";

export default function SidebarPages({ pages, defaultPage }) {
    const [page, setPage] = useState(defaultPage);
    return (
        <div>
            <div className="sidebar">
                {
                    Object.entries(pages).map(([key, item]) => (
                        <IconButton onClick={() => setPage(key)} label={key} selected={page === key}/>
                    ))
                }
            </div>
            <div style={{
                marginLeft: "155px"
            }}>
                {pages[page]}
            </div>
        </div>
    )
}