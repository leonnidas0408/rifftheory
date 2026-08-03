// resources.js
// Recursos armazenados no HTML (para o código ficar sem clutter cheio de variáveis grandes).
// Os dados "estáticos" do app (notas, escalas, estilos, fórmulas de acorde, diagramas
// no braço) ficam em blocos <script type="application/json"> no final do index.html,
// e são lidos em tempo de execução por getResource().

/**
 * Lê o conteúdo de um <script id="..."> do HTML e retorna:
 * - o objeto/array já parseado (JSON.parse), se json=true (padrão); ou
 * - o texto bruto, se json=false.
 * Retorna null se não existir elemento com esse id, e undefined se o elemento
 * existir mas não for uma tag <script> (uso defensivo, não deve ocorrer na prática).
 */
function getResource(id, json = true) {
    const res = document.getElementById(id);
    if (!res)
        return null;
    if (res && res.nodeName == "SCRIPT") {
        return !json ? res.textContent : JSON.parse(res.textContent);
    }
    return undefined;
}