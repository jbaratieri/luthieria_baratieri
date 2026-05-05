/**
 * Migra <header>...</header> para site-header + hero + hero-inner (padrão editorial).
 * Ignora: blog/index.html, ficheiros que já têm <div class="hero"> a seguir ao header.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, "..", "blog");

const SKIP_FILES = new Set(["index.html"]);

function stripBlogOnlyBlocks(inner) {
  let s = inner;
  // Parágrafo só com link Blog
  s = s.replace(
    /<p[^>]*>\s*←\s*<a\s+href="\/blog\/"[^>]*>\s*Blog\s*<\/a>\s*<\/p>\s*/gi,
    ""
  );
  s = s.replace(
    /<p[^>]*>\s*←\s*<a\s+href="\/blog\/"[^>]*>\s*Voltar\s+para\s+o\s+blog\s*<\/a>\s*<\/p>\s*/gi,
    ""
  );
  // Variante "Voltar ao Blog" na série índice
  s = s.replace(
    /<nav[^>]*>\s*<a\s+href="\/blog\/"[^>]*>\s*←\s*Voltar\s+ao\s+Blog\s*<\/a>\s*<\/nav>\s*/gi,
    ""
  );
  return s;
}

function alreadyMigrated(html) {
  return /\n\s*<\/header>\s*\n\s*<div\s+class="hero"/.test(html);
}

function migrateFile(filePath, name) {
  let html = fs.readFileSync(filePath, "utf8");
  if (SKIP_FILES.has(name)) {
    console.log("skip (lista):", name);
    return;
  }
  if (alreadyMigrated(html)) {
    console.log("skip (já com hero):", name);
    return;
  }

  const m = html.match(/<header>\s*([\s\S]*?)\s*<\/header>/);
  if (!m) {
    console.log("skip (sem <header> simples):", name);
    return;
  }

  let inner = stripBlogOnlyBlocks(m[1].trim());
  inner = inner.replace(/\n{3,}/g, "\n\n");

  const replacement = `<header class="site-header">
        <nav>
            ← <a href="/blog/">Blog</a>
        </nav>
    </header>

    <div class="hero">
        <div class="hero-inner">
${inner}
        </div>
    </div>`;

  const newHtml = html.replace(/<header>\s*[\s\S]*?\s*<\/header>/, replacement);
  fs.writeFileSync(filePath, newHtml, "utf8");
  console.log("OK:", name);
}

for (const name of fs.readdirSync(blogDir)) {
  if (!name.endsWith(".html")) continue;
  migrateFile(path.join(blogDir, name), name);
}
