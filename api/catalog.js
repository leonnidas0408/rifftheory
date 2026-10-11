// Endpoint de leitura do catálogo e dos relatórios gerados pelo pipeline local.
// Requer login Supabase e CATALOG_OWNER_USER_ID para impedir exposição dos metadados do Drive.
const { readFileSync } = require("node:fs");
const path = require("node:path");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const OWNER_ID = process.env.CATALOG_OWNER_USER_ID;
function readJson(name, fallback) {
  try { return JSON.parse(readFileSync(path.join(__dirname, name), "utf8")); }
  catch { return fallback; }
}
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ erro: "Método não permitido." });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OWNER_ID) {
    return res.status(503).json({ erro: "Catálogo não configurado no servidor." });
  }
  const authorization = req.headers.authorization || "";
  const tokenMatch = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!tokenMatch) return res.status(401).json({ erro: "Faça login para acessar o catálogo." });
  try {
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${tokenMatch[1]}` } });
    if (!auth.ok) return res.status(401).json({ erro: "Sessão inválida." });
    const user = await auth.json();
    if (user.id !== OWNER_ID) return res.status(403).json({ erro: "Acesso restrito ao proprietário do catálogo." });
  } catch {
    return res.status(401).json({ erro: "Não foi possível validar a sessão." });
  }
  const media = readJson("media-catalog.json", []);
  const localReport = readJson("catalog-report.json", null);
  const driveReport = readJson("drive-quality-report.json", null);
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ generatedAt: new Date().toISOString(), catalog: media, quality: { local: localReport, googleDrive: driveReport } });
};
