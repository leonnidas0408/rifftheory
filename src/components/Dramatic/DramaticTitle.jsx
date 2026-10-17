import React from "react";
import "./Dramatic.css";

export default function DramaticTitle({ title }) {
    let split = title.split(" ");
    return (
        <div className="dramatic-title">
            {
                split.map((item, index) => (
                     <h1 key={index} className={index % 2 == 0 ? "primary" : "secondary"}>{item}</h1>
                ))
            }
        </div>
    )
}
