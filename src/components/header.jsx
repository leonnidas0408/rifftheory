import React from "react";

export default function Header({ title, span, icon }) {
    let split = title.split(" ");
    return (
        <header>
            <img src={icon} width={128} height={128}></img>
            {
                split.map((item, index) => (
                    <h1 className={index % 2 == 0 ? "primary" : "secondary"}>{item}</h1>
                ))
            }
            <span>{span}</span>
        </header>
    )
}