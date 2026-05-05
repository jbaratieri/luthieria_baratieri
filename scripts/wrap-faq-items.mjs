/**
 * Envolve cada par pergunta/resposta (h3 + parágrafos) em <div class="faq-item">
 * dentro de <section class="faq">. Ignora secções que já contêm faq-item.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, "..", "blog");

const FILES = [
  "troculo-violao-taco-espanhol-soleta.html",
  "como-fazer-tampo-violao-guia-completo.html",
  "braco-violao-moldagem-bruta.html",
  "esquadrejar-e-planejar-o-braco.html",
  "como-funciona-o-tensor-do-violao.html",
  "como-fazer-braco-violao-guia-completo.html",
  "headstock-e-troculo-braco-violao.html",
  "como-fazer-tampo-violao.html",
  "como-fazer-boca-roseta-violao.html",
  "tampo-varetas-e-leque-harmonico.html",
  "fundo-do-violao.html",
  "madeiras-para-braco-violao.html",
];

/**
 * Remove indentação comum só nas linhas que são marcação (começam com `<` após espaços).
 * Linhas de texto dentro de `<p>` preservam recuo relativo ao bloco de tags.
 */
function dedentAndIndent(block, innerSpaces) {
  const lines = block.split("\n");
  const pad = " ".repeat(innerSpaces);

  const tagIndents = lines
    .filter((l) => l.trim().startsWith("<"))
    .map((l) => l.match(/^(\s*)/)[1].length);

  if (tagIndents.length === 0) return block;
  const minIndent = Math.min(...tagIndents);

  return lines
    .map((line) => {
      if (!line.trim()) return "";
      return pad + line.slice(minIndent);
    })
    .join("\n");
}

function wrapFaqInner(inner) {
  if (/\bfaq-item\b/.test(inner)) return null;

  /** Sem `\s*` após `</h2>` — senão engole quebras e a indentação antes do primeiro `<h3>`. */
  const h2Match = inner.match(/^(\s*<h2\b[\s\S]*?<\/h2>)/);
  if (!h2Match) return null;

  const rest = inner.slice(h2Match[0].length);
  const positions = [];
  const re = /<h3\b/g;
  let m;
  while ((m = re.exec(rest)) !== null) positions.push(m.index);
  if (positions.length === 0) return null;

  /** Início da linha onde está o <h3> (evita cortar a indentação ao usar indexOf). */
  function lineStart(s, idx) {
    const nl = s.lastIndexOf("\n", idx - 1);
    return nl === -1 ? 0 : nl + 1;
  }

  const blocks = [];
  for (let i = 0; i < positions.length; i++) {
    const start = lineStart(rest, positions[i]);
    const end =
      i + 1 < positions.length ? lineStart(rest, positions[i + 1]) : rest.length;
    blocks.push(rest.slice(start, end).trimEnd());
  }

  const wrapped = blocks
    .map((block) => {
      const body = dedentAndIndent(block, 20);
      return `                <div class="faq-item">\n${body}\n                </div>`;
    })
    .join("\n\n");

  return h2Match[0] + "\n\n" + wrapped + "\n\n";
}

function transform(html) {
  return html.replace(
    /(<section\s+class="faq">)([\s\S]*?)(\s*<\/section>)/g,
    (full, open, inner, close) => {
      const next = wrapFaqInner(inner);
      if (next === null) return full;
      return open + next + close;
    }
  );
}

let changed = 0;
for (const name of FILES) {
  const filePath = path.join(blogDir, name);
  const before = fs.readFileSync(filePath, "utf8");
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    changed++;
    console.log("updated:", name);
  } else {
    console.log("skip (unchanged or no faq blocks):", name);
  }
}
console.log("done,", changed, "files modified");
