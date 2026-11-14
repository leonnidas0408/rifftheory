import React from "react";
import "./ThonicAvatar.css";

export default function ThonicAvatar({ speaking = false, alt = "Thonic", size = 42, className = "" }) {
    return (
        <span
            className={`thonic-avatar-sprite${speaking ? " is-speaking" : ""}${className ? ` ${className}` : ""}`}
            role="img"
            aria-label={alt}
            style={{ width: size, height: size }}
        />
    );
}
