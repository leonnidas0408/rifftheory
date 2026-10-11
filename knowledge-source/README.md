# Ingestão híbrida e catálogo

Coloque materiais locais aqui (subpastas são aceitas). O pipeline converte
`.txt`, `.md`, `.docx` e `.pdf` em trechos para `api/chat.js`; PDFs digitalizados
usam OCR opcional. MP3 e outros formatos de áudio são catalogados pelos tags
ID3/metadata; imagens são catalogadas por formato e dimensões.

```bash
npm run build:knowledge
```

Artefatos gerados: `api/knowledge-chunks.json`, `api/media-catalog.json` e
`api/catalog-report.json`. A base de chunks preexistente é preservada se a
pasta não tiver arquivos de entrada.

## Sincronizar Google Drive

Instale e autentique o Google Workspace CLI (`gws`) na máquina de ingestão.
Defina `DRIVE_FOLDER_ID` para selecionar explicitamente a pasta cujos arquivos
diretos serão importados e `DRIVE_MAX_FILE_MB` (padrão 100) para limitar cada
download. Sem pasta definida, o relatório examina os metadados do Drive, mas
nenhum conteúdo é baixado. Pastas, atalhos, duplicatas por MD5 e arquivos acima
do limite nunca são baixados; ZIPs, vídeos e formatos não suportados só são
registrados no relatório.

```bash
npm run sync:drive       # gera api/drive-quality-report.json e baixa para drive-import/
npm run build:knowledge  # extrai os documentos e cataloga áudio/imagens baixados
# ou: npm run build:catalog (executa os dois passos)
```

DOCX usa `unzip` para extrair o XML; PDFs usam `pdf-parse`. Para OCR instale `poppler-utils` e
`tesseract-ocr` com os idiomas necessários (padrão `por+eng`); sem eles o PDF
continua no relatório com alerta de OCR não disponível. Parâmetros opcionais:
`OCR_LANG`, `OCR_DPI`, `OCR_MIN_TEXT_CHARS`, `KNOWLEDGE_CHUNK_SIZE` e
`KNOWLEDGE_CHUNK_OVERLAP`.

## Endpoint e segurança

`GET /api/catalog` devolve o catálogo e os relatórios após autenticação
Supabase e comparação do usuário com `CATALOG_OWNER_USER_ID`. Configure essa
variável no ambiente serverless; sem ela o endpoint responde 503 e usuários
que não forem o proprietário recebem 403. O endpoint nunca aceita escrita.

Os downloads de `knowledge-source/drive-import/` são ignorados pelo Git. Os
relatórios/catálogos de execução podem conter nomes e IDs privados do Drive;
revise-os e **não os publique em um repositório público**. A API só os servirá
quando os artefatos existirem no deploy e o proprietário estiver configurado.
