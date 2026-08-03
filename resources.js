// Recursos armazenados no HTML (para o código ficar sem clutter cheio de variáveis grandes)

function getResource(id, json = true) {
    const res = document.getElementById(id);
    if (!res)
        return null;
    if (res && res.nodeName == "SCRIPT") {
        return !json ? res.textContent : JSON.parse(res.textContent);
    }
    return undefined;
}