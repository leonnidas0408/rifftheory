import React from "react";

export default function Header({ title, span }) {
    let split = title.split(" ");
    return (
        <header>
            {
                split.map((item, index) => (
                    <h1 className={index % 2 != 0 ? "primary" : "secondary"}>{item}</h1>
                ))
            }
            <span>{span}</span>
        </header>
    )
}