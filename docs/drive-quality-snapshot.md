# Auditoria de qualidade do Google Drive

**Data da coleta:** 11/10/2026 (horário da sessão).

**Escopo:** inventário de metadados (`name`, tipo MIME, tamanho e checksum MD5) dos itens visíveis no Drive conectado. Nenhum conteúdo foi baixado para esta auditoria. Nomes, IDs, URLs e hashes foram deliberadamente omitidos deste relatório.

## Resumo

| Indicador | Resultado |
|---|---:|
| Itens listados | 242 |
| Texto simples (`.txt`) | 125 |
| PDF por MIME | 49 |
| PDF pela extensão `.pdf` | 50 |
| DOCX | 1 |
| Colab notebooks | 15 |
| Imagens JPEG | 2 |
| Áudio MP3 | 0 |
| Áudio M4A | 1 |
| Vídeos | 10 |
| Pastas e atalhos | 27 |
| Itens com tamanho igual a zero | 17 |
| Itens sem tamanho informado | 28 — 27 são pastas/atalhos; 1 é outro item |
| Arquivos acima de 100 MiB | 11 |
| Arquivos acima de 1 GiB | 2 |
| Grupos com checksum MD5 repetido | 10 grupos / 65 itens (55 cópias além da primeira) |

Os números por extensão e MIME diferem ligeiramente, pois há itens cujo nome e tipo MIME não coincidem.

## Achados e recomendações

1. **Duplicatas:** revisar os 10 grupos de checksum repetido antes de qualquer limpeza. Checksum igual indica bytes iguais, mas não prova que as cópias sejam dispensáveis. Nenhum arquivo foi removido.
2. **Arquivos vazios:** revisar os 17 itens binários com tamanho zero; podem ser placeholders ou uploads incompletos. Os 27 contêineres/atalhos sem tamanho não devem ser classificados como arquivos vazios.
3. **Arquivos grandes:** a ingestão seletiva padrão limita cada download a 100 MiB; portanto, os 11 itens acima desse limite não são baixados automaticamente. Dois superam 1 GiB. O ZIP maior que 2,6 GB permanece fora do pipeline por formato e tamanho.
4. **OCR e extração:** metadados não permitem saber quais PDFs são digitalizados. A classificação por conteúdo é feita quando o pipeline processa os PDFs; esse inventário não baixou documentos para verificar texto/OCR.
5. **Cobertura:** o Drive contém bastante material textual/PDF, mas a política de ingestão também exclui formatos fora da lista suportada. O relatório detalhado por arquivo é produzido em `api/drive-quality-report.json` após `npm run sync:drive`.

## Método e privacidade

A coleta usou apenas listagem paginada de metadados do Drive. O pipeline local não remove arquivos do Drive e ignora no Git os materiais importados. O relatório detalhado contém nomes/IDs e deve permanecer privado; este snapshot contém somente estatísticas agregadas.
