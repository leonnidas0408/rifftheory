import React from "react";
import "./Dramatic.css";

export default function DramaticCTA({ actions }) {
    return (
        <div className="dramatic-cta">
            {
                actions.map((item, index) => (
                    <span className="dramatic-cta-item">
                        <span>{item}</span>
                        {index !== actions.length - 1 ? <div className="cta-separator"></div> : <span></span>}
                    </span>
                ))
            }
        </div>
    )
}
