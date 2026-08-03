import React from "react";

export default function Header({ title, span }) {
    return (
        <header>
            <h1>{title}</h1>
            <span>{span}</span>
        </header>
    )
}