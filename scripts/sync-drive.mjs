// Importa seletivamente materiais do Drive via Google Workspace CLI e gera auditoria.
// Exige gws autenticado; não importa pastas, atalhos, vídeos, arquivos compactados ou duplicatas.
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destRoot = path.join(root, "knowledge-source", "drive-import");
const reportPath = path.join(root, "api", "drive-quality-report.json");
const configuredLimit = Number(process.env.DRIVE_MAX_FILE_MB || 100);
const maxBytes = (Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 100) * 1024 * 1024;
const folderId = process.env.DRIVE_FOLDER_ID;
const allowed = new Set([".pdf", ".docx", ".txt", ".md", ".mp3", ".m4a", ".wav", ".flac", ".ogg", ".aac", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff", ".bmp", ".avif"]);
const mimeExtension = { "application/vnd.google-apps.document": ".txt" };
function run(args, options = {}) { return execFileSync("gws", args, { encoding: "utf8", maxBuffer: 30 * 1024 * 1024, ...options }); }
function listDriveFiles() {
  const q = folderId ? `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false` : "trashed = false";
  const raw = run(["drive", "files", "list", "--params", JSON.stringify({ pageSize: 100, q, fields: "files(id,name,mimeType,size,modifiedTime,md5Checksum,webViewLink,parents),nextPageToken" }), "--page-all", "--page-limit", "100"]);
  return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { const data = JSON.parse(line); return Array.isArray(data.files) ? data.files : []; } catch { return []; }
  });
}
function safeName(value) { return path.basename(value || "arquivo").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/\s+/g, " ").slice(0, 150) || "arquivo"; }
function classify(file) {
  const ext = path.extname(file.name || "").toLowerCase() || mimeExtension[file.mimeType] || "";
  if (file.mimeType === "application/vnd.google-apps.folder" || file.mimeType === "application/vnd.google-apps.shortcut") return { ext, category: "container" };
  if (file.mimeType === "application/vnd.google-apps.document") return { ext: ".txt", category: "document" };
  if (["application/pdf"].includes(file.mimeType) || ext === ".pdf") return { ext: ".pdf", category: "document" };
  if (ext === ".docx" || ext === ".txt" || ext === ".md") return { ext, category: "document" };
  if ([".mp3", ".m4a", ".wav", ".flac", ".ogg", ".aac"].includes(ext)) return { ext, category: "audio" };
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff", ".bmp", ".avif"].includes(ext)) return { ext, category: "image" };
  return { ext, category: "unsupported" };
}
function download(file, ext, dest) {
  const args = file.mimeType === "application/vnd.google-apps.document"
    ? ["drive", "files", "export", "--params", JSON.stringify({ fileId: file.id, mimeType: "text/plain" }), "--output", dest]
    : ["drive", "files", "get", "--params", JSON.stringify({ fileId: file.id, alt: "media" }), "--output", dest];
  run(args, { stdio: ["ignore", "pipe", "pipe"] });
  if (!existsSync(dest) || !statSync(dest).size) throw new Error("download vazio");
}
async function main() {
  mkdirSync(destRoot, { recursive: true });
  const files = listDriveFiles();
  const hashes = new Map();
  const issues = [];
  const counts = { total: files.length, foldersAndShortcuts: 0, documents: 0, audio: 0, images: 0, unsupported: 0, imported: 0, skippedLarge: 0, duplicates: 0, empty: 0, failures: 0 };
  const records = [];
  for (const file of files) {
    const { ext, category } = classify(file);
    const size = Number(file.size || 0);
    const item = { id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: Number.isFinite(size) ? size : null, modifiedTime: file.modifiedTime || null, md5Checksum: file.md5Checksum || null, category, status: "skipped" };
    if (category === "container") { counts.foldersAndShortcuts++; item.reason = "container"; records.push(item); continue; }
    if (size === 0 && file.size !== undefined) { counts.empty++; item.reason = "empty"; issues.push({ id: file.id, name: file.name, severity: "warning", code: "empty", message: "Arquivo com tamanho zero." }); }
    if (category === "unsupported") { counts.unsupported++; item.reason = "unsupported_format"; records.push(item); continue; }
    counts[category === "document" ? "documents" : category === "audio" ? "audio" : "images"]++;
    if (size > maxBytes) { counts.skippedLarge++; item.reason = "above_size_limit"; issues.push({ id: file.id, name: file.name, severity: "warning", code: "large_file", message: `Tamanho acima do limite configurado (${process.env.DRIVE_MAX_FILE_MB || 100} MB).` }); records.push(item); continue; }
    if (file.md5Checksum && hashes.has(file.md5Checksum)) { counts.duplicates++; item.reason = "duplicate_checksum"; item.duplicateOf = hashes.get(file.md5Checksum); issues.push({ id: file.id, name: file.name, severity: "info", code: "duplicate", message: "Mesmo checksum MD5 de outro arquivo." }); records.push(item); continue; }
    if (file.md5Checksum) hashes.set(file.md5Checksum, file.id);
    if (!allowed.has(ext)) { counts.unsupported++; item.reason = "unsupported_extension"; records.push(item); continue; }
    if (!folderId) { item.reason = "folder_id_required_for_import"; records.push(item); continue; }
    const destName = `${file.id.slice(0, 10)}-${safeName(file.name).replace(/\.[^.]+$/, "")}${ext}`;
    const dest = path.join(destRoot, destName);
    try {
      download(file, ext, dest);
      counts.imported++; item.status = "imported"; item.localPath = path.relative(root, dest).split(path.sep).join("/"); item.downloadedBytes = statSync(dest).size;
    } catch (err) {
      counts.failures++; item.reason = "download_failed";
      issues.push({ id: file.id, name: file.name, severity: "error", code: "download_failed", message: String(err.stderr || err.message).slice(0, 400) });
    }
    records.push(item);
  }
  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), source: "Google Drive", folderId: folderId || null, maxFileBytes: maxBytes, counts, issues, files: records };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Drive: ${counts.total} itens; importados ${counts.imported}; limites excedidos ${counts.skippedLarge}; duplicados ${counts.duplicates}; alertas ${issues.length}.`);
  console.log(`Relatório: ${path.relative(root, reportPath)}`);
}
main().catch((err) => { console.error(`Falha no sync do Drive: ${err.message}`); process.exitCode = 1; });
