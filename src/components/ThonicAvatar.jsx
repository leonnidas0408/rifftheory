import React from "react";
import "./ThonicAvatar.css";

export default function ThonicAvatar({ alt = "Thonic", size = 42, className = "" }) {
    return (
        <img
            className={`thonic-avatar${className ? ` ${className}` : ""}`}
            src="/thonic.webp"
            role="img"
            aria-label={alt}
            width={size}
            height={size}
        />
    );
}
