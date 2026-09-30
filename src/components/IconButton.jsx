import React from "react";
import Icone from "./Icone";

export default function IconButton({ onClick, label, icon, selected, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={disabled ? "Em breve" : undefined}
            className={`icon-button${selected ? " selected" : ""}`}
        >
            <Icone nome={icon} />
            <span>{label}</span>
            {disabled && <span className="em-breve">em breve</span>}
        </button>
    );
}
