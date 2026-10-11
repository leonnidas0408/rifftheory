// Gera a base RAG, catálogo de mídia e relatório de qualidade a partir de knowledge-source/.
// Execução local/CI: npm run build:knowledge (OCR opcional via pdftoppm + tesseract).
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parseFile } from "music-metadata";
import { imageSize } from "image-size";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "knowledge-source");
const outputChunks = path.join(root, "api", "knowledge-chunks.json");
const outputCatalog = path.join(root, "api", "media-catalog.json");
const outputReport = path.join(root, "api", "catalog-report.json");
const chunkSize = Number(process.env.KNOWLEDGE_CHUNK_SIZE || 1000);
const overlap = Number(process.env.KNOWLEDGE_CHUNK_OVERLAP || 150);
const OCR_MIN_CHARS = Number(process.env.OCR_MIN_TEXT_CHARS || 80);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".tif", ".tiff", ".bmp", ".avif"]);
const AUDIO_EXT = new Set([".mp3", ".m4a", ".wav", ".flac", ".ogg", ".aac"]);
const TEXT_EXT = new Set([".txt", ".md", ".pdf", ".docx"]);

function listFiles(dir) {
  let files = [];
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name.toLowerCase() === "readme.md") continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    files = files.concat(st.isDirectory() ? listFiles(full) : [full]);
  }
  return files;
}
function clean(text) {
  return String(text || "").replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function decodeXml(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, key) => {
    if (key === "amp") return "&";
    if (key === "lt") return "<";
    if (key === "gt") return ">";
    if (key === "quot") return '"';
    if (key === "apos") return "'";
    const value = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return Number.isFinite(value) && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
  });
}
function extractDocx(file) {
  const xml = execFileSync("unzip", ["-p", file, "word/document.xml"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].map(([, paragraph]) => {
    const runs = [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(([, text]) => decodeXml(text));
    return runs.join("");
  }).filter(Boolean);
  return paragraphs.join("\n");
}
function makeChunks(text, source) {
  const normalized = clean(text);
  const chunks = [];
  if (!normalized) return chunks;
  let start = 0, index = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const part = normalized.slice(start, end).trim();
    if (part.length > 40) chunks.push({ id: `${source}__${index++}`, source, text: part });
    if (end >= normalized.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}
function commandExists(command) {
  try { execFileSync("sh", ["-c", `command -v ${command}`], { stdio: "ignore" }); return true; }
  catch { return false; }
}
async function extractPdf(file) {
  const buffer = readFileSync(file);
  const { default: pdfParse } = await import("pdf-parse");
  const parsed = await pdfParse(buffer);
  let text = clean(parsed.text);
  let ocr = false;
  if (text.length < OCR_MIN_CHARS) {
    if (!commandExists("pdftoppm") || !commandExists("tesseract")) {
      return { text, pages: parsed.numpages || null, ocr, warning: "PDF parece digitalizado; instale pdftoppm e tesseract-ocr para executar OCR." };
    }
    const fsPromises = await import("node:fs/promises");
    const os = await import("node:os");
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "rifftheory-ocr-"));
    try {
      const prefix = path.join(tempDir, "page");
      execFileSync("pdftoppm", ["-jpeg", "-r", process.env.OCR_DPI || "180", file, prefix], { stdio: "ignore", timeout: 180000 });
      const pages = readdirSync(tempDir).filter((f) => f.endsWith(".jpg")).sort();
      const recognized = [];
      for (const page of pages) {
        recognized.push(execFileSync("tesseract", [path.join(tempDir, page), "stdout", "-l", process.env.OCR_LANG || "por+eng"], { encoding: "utf8", timeout: 120000 }));
      }
      const ocrText = clean(recognized.join("\n\n"));
      if (ocrText.length > text.length) { text = ocrText; ocr = true; }
    } finally { await fsPromises.rm(tempDir, { recursive: true, force: true }); }
  }
  return { text, pages: parsed.numpages || null, ocr };
}
async function processFile(file) {
  const relative = path.relative(sourceRoot, file).split(path.sep).join("/");
  const ext = path.extname(file).toLowerCase();
  const stat = statSync(file);
  const result = { source: relative, kind: "unsupported", bytes: stat.size, chunks: 0, warnings: [] };
  if (TEXT_EXT.has(ext)) {
    result.kind = "document";
    let text = "";
    if (ext === ".txt" || ext === ".md") text = readFileSync(file, "utf8");
    else if (ext === ".docx") text = extractDocx(file);
    else {
      const pdf = await extractPdf(file);
      text = pdf.text;
      result.pages = pdf.pages;
      result.ocr = pdf.ocr;
      if (pdf.warning) result.warnings.push(pdf.warning);
    }
    result.textCharacters = clean(text).length;
    if (!result.textCharacters) result.warnings.push("Sem texto extraível.");
    result._chunks = makeChunks(text, relative);
    result.chunks = result._chunks.length;
    if (result.textCharacters > 0 && result.chunks === 0) result.warnings.push("Texto extraído, mas insuficiente para gerar trecho de busca.");
  } else if (AUDIO_EXT.has(ext)) {
    result.kind = "audio";
    try {
      const meta = await parseFile(file, { duration: true });
      const tags = meta.common || {};
      result.metadata = { format: meta.format.container || ext.slice(1), codec: meta.format.codec || null, durationSeconds: Number.isFinite(meta.format.duration) ? Math.round(meta.format.duration * 10) / 10 : null, bitrate: meta.format.bitrate || null, sampleRate: meta.format.sampleRate || null, channels: meta.format.numberOfChannels || null, title: tags.title || null, artist: tags.artist || null, album: tags.album || null, year: tags.year || null, genre: tags.genre || [] };
      if (!result.metadata.durationSeconds) result.warnings.push("Duração de áudio indisponível.");
      if (!result.metadata.title && !result.metadata.artist) result.warnings.push("Tags ID3 ausentes; usar o nome do arquivo como rótulo.");
    } catch (err) { result.warnings.push(`Falha ao ler metadados de áudio: ${err.message}`); }
  } else if (IMAGE_EXT.has(ext)) {
    result.kind = "image";
    try {
      const dim = imageSize(readFileSync(file));
      result.metadata = { format: dim.type || ext.slice(1), width: dim.width || null, height: dim.height || null };
      if (!dim.width || !dim.height) result.warnings.push("Dimensões da imagem indisponíveis.");
    } catch (err) { result.warnings.push(`Imagem inválida ou não reconhecida: ${err.message}`); }
  } else {
    result.warnings.push("Formato não suportado; arquivo não foi extraído nem catalogado.");
  }
  return result;
}
async function main() {
  const files = listFiles(sourceRoot);
  const chunks = [];
  const catalog = [];
  const issues = [];
  const counts = { total: 0, documents: 0, audio: 0, images: 0, unsupported: 0, withWarnings: 0, empty: 0, ocr: 0 };
  for (const file of files) {
    try {
      const item = await processFile(file);
      if (item._chunks) chunks.push(...item._chunks);
      delete item._chunks;
      catalog.push(item);
      counts.total++;
      if (item.kind === "document") counts.documents++;
      else if (item.kind === "audio") counts.audio++;
      else if (item.kind === "image") counts.images++;
      else counts.unsupported++;
      if (item.ocr) counts.ocr++;
      if (!item.bytes || (item.kind === "document" && !item.textCharacters)) counts.empty++;
      if (item.warnings.length) { counts.withWarnings++; issues.push({ source: item.source, kind: item.kind, warnings: item.warnings }); }
      console.log(`${item.warnings.length ? "!" : "✓"} ${item.source} [${item.kind}] — ${item.chunks || 0} trecho(s)`);
    } catch (err) {
      const item = { source: path.relative(sourceRoot, file).split(path.sep).join("/"), kind: "error", bytes: statSync(file).size, chunks: 0, warnings: [`Falha no processamento: ${err.message}`] };
      catalog.push(item); issues.push({ source: item.source, kind: item.kind, warnings: item.warnings }); counts.total++; counts.withWarnings++;
      console.error(`✗ ${item.source}: ${err.message}`);
    }
  }
  // Não apagar chunks anteriores por acidente quando a pasta de entrada estiver vazia.
  if (files.length) writeFileSync(outputChunks, JSON.stringify(chunks, null, 2));
  writeFileSync(outputCatalog, JSON.stringify(catalog, null, 2));
  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), source: "knowledge-source", counts: { ...counts, chunks: chunks.length }, quality: { clean: counts.total - counts.withWarnings, withWarnings: counts.withWarnings, empty: counts.empty, unsupported: counts.unsupported, ocrUsed: counts.ocr }, issues };
  writeFileSync(outputReport, JSON.stringify(report, null, 2));
  console.log(`\nConcluído: ${chunks.length} trecho(s), ${counts.audio} áudio(s), ${counts.images} imagem(ns), ${issues.length} alerta(s).`);
  if (!files.length) console.log("Entrada vazia: a base de chunks existente foi preservada.");
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
