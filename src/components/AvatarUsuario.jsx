import { useState } from "react";

import { useAuth } from "../auth/AuthContext";
import Icone from "./Icone";
import "./AvatarUsuario.css";

function AvatarInicial({ nome, tamanho }) {
    const inicial = nome.trim().slice(0, 1).toUpperCase() || "?";

    return (
        <span
            className={`avatar-usuario-inicial avatar-usuario-tamanho-${tamanho}`}
            role="img"
            aria-label={`Perfil de ${nome}`}
            title={nome}
        >
            {inicial}
        </span>
    );
}

function AvatarComFoto({ url, nome, tamanho }) {
    const [imagemFalhou, setImagemFalhou] = useState(false);

    if (imagemFalhou) return <AvatarInicial nome={nome} tamanho={tamanho} />;

    return (
        <img
            className="avatar-usuario-foto"
            src={url}
            alt={`Foto de perfil de ${nome}`}
            width={tamanho}
            height={tamanho}
            onError={() => setImagemFalhou(true)}
        />
    );
}

export default function AvatarUsuario({ tamanho = 28 }) {
    const { user, getAvatarUrl, getDisplayName } = useAuth();

    if (!user) return <Icone nome="conta" tamanho={tamanho} />;

    const nome = getDisplayName(user);
    const avatarUrl = getAvatarUrl(user);

    return avatarUrl ? (
        <AvatarComFoto key={avatarUrl} url={avatarUrl} nome={nome} tamanho={tamanho} />
    ) : (
        <AvatarInicial nome={nome} tamanho={tamanho} />
    );
}
