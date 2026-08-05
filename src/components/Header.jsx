import React from "react";
import DramaticTitle from "./DramaticTitle";

export default function Header({ title, span, icon }) {
    return (
        <header>
            <img src={icon} width={128} height={128}></img>
            <DramaticTitle title={title}/>
            <span>{span}</span>
        </header>
    )
}