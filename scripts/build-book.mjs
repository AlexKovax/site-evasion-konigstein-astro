// scripts/build-book.mjs
//
// Assemble les chapitres Markdown (FR) dans l'ordre du récit et prépare les
// artefacts du livre dans dist/book/ :
//
//   dist/book/manuscript.md   — corps concaténés (pour l'EPUB via Pandoc)
//   dist/book/book.html       — HTML complet, mis en page pour le PDF (WeasyPrint)
//   dist/book/metadata.yaml   — métadonnées Pandoc (titre, auteurs, lang)
//
// Le PDF et l'EPUB sont produits séparément par `npm run book:pdf` / `book:epub`
// qui appellent respectivement WeasyPrint et Pandoc sur ces artefacts.
//
// Ordre du récit : l'introduction (chapter absent) en premier, puis les
// chapitres numérotés 1..25, puis par date de publication (cf. src/lib/posts.ts).
//
// Images : dans le Markdown, les chemins sont absolus `/content/images/...`.
//   - Pour le PDF (WeasyPrint) on conserve `/content/...` et on passe
//     `--base-url public/` au moment du rendu.
//   - Pour l'EPUB (Pandoc) on réécrit en `content/...` (relatif) et Pandoc
//     résout les ressources via `--resource-path=public`.
//
// Usage :  node scripts/build-book.mjs [--lang fr]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');
const PUBLIC_DIR = join(ROOT, 'public');
const OUT_DIR = join(ROOT, 'dist', 'book');

// ------------------------------------------------------------------
// Métadonnées du livre
// ------------------------------------------------------------------
const BOOK = {
  fr: {
    title: 'Évasion à Königstein',
    subtitle: 'Une histoire familiale — de Dannevoux à Samarcande',
    authors: ['Françoise', 'Vladimir'],
    lang: 'fr-FR',
    cover: '/content/images/2020/04/konig.jpg',
    introLabel: 'Introduction',
  },
};

// ------------------------------------------------------------------
// Lecture et tri des articles
// ------------------------------------------------------------------
function parseFrontmatter(text) {
  // Bloc frontmatter délimité par des lignes « --- ».
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const fm = m[1];
  const body = m[2];
  const data = {};
  // Champs simples sur une ligne.
  const grab = (key) => {
    const r = new RegExp(`^${key}:\\s*(.+)$`, 'm');
    const mm = fm.match(r);
    return mm ? mm[1].trim() : undefined;
  };
  const str = (v) => {
    if (v == null) return undefined;
    return v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  };
  data.slug = str(grab('slug'));
  data.title = str(grab('title'));
  data.lang = str(grab('lang')) || 'fr';
  const ch = grab('chapter');
  data.chapter = ch ? parseInt(ch, 10) : undefined;
  const pd = grab('pubDatetime');
  data.pubDatetime = pd ? new Date(pd) : undefined;
  const au = grab('authors');
  if (au) data.authors = au.replace(/^\[/, '').replace(/\]$/, '').split(',').map((s) => s.trim().replace(/"/g, ''));
  return { data, body };
}

function loadPosts(lang) {
  const dir = join(POSTS_DIR, lang);
  const files = readdirSync(dir).filter((f) => extname(f) === '.md');
  const posts = files.map((f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    const { data, body } = parseFrontmatter(text);
    return { file: f, data, body };
  });
  // Même ordre que src/lib/posts.ts : intro (chapter null) en premier, puis
  // chapitres numérotés, puis par date.
  return posts.sort((a, b) => {
    const ca = a.data.chapter ?? -1;
    const cb = b.data.chapter ?? -1;
    if (ca !== cb) return ca - cb;
    return (a.data.pubDatetime?.getTime() ?? 0) - (b.data.pubDatetime?.getTime() ?? 0);
  });
}

// ------------------------------------------------------------------
// Markdown -> HTML (fragment) via Pandoc
// ------------------------------------------------------------------
function mdToHtml(markdown) {
  // Pandoc lit stdin, écrit stdout. On désactive la standalones.
  return execFileSync('pandoc', ['--from=markdown', '--to=html5', '--no-highlight'], {
    input: markdown,
    encoding: 'utf8',
  });
}

// ------------------------------------------------------------------
// Construction du manuscript.md (pour EPUB)
// ------------------------------------------------------------------
function buildManuscript(posts, meta) {
  let md = '';
  for (const p of posts) {
    const isIntro = p.data.chapter == null;
    const heading = isIntro
      ? `# ${meta.introLabel} — ${p.data.title}\n`
      : `# ${p.data.title}\n`;
    // Réécriture des chemins d'images : /content/ -> content/
    const body = p.body.replace(/\/content\//g, 'content/');
    md += `\n${heading}\n${body.trim()}\n`;
  }
  return md;
}

// ------------------------------------------------------------------
// Construction du book.html (pour PDF / WeasyPrint)
// ------------------------------------------------------------------
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHtml(posts, meta, cssText) {
  const authorsStr = meta.authors.join(' & ');

  // Sommaire
  const tocItems = posts
    .map((p, i) => {
      const label = p.data.chapter == null ? meta.introLabel : `Chapitre ${p.data.chapter}`;
      return `<li><a href="#ch-${i}"><span class="toc-num">${escapeHtml(label)}</span><span class="toc-title">${escapeHtml(p.data.title)}</span></a></li>`;
    })
    .join('\n');

  // Chapitres
  const chapters = posts
    .map((p, i) => {
      const html = mdToHtml(p.body).replace(/\/(content\/)/g, '$1');
      const isIntro = p.data.chapter == null;
      const label = isIntro ? meta.introLabel : `Chapitre ${p.data.chapter}`;
      return `<section class="chapter" id="ch-${i}">
  <header class="chapter-header">
    <p class="chapter-label">${escapeHtml(label)}</p>
    <h2>${escapeHtml(p.data.title)}</h2>
  </header>
${html}
</section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="${meta.lang}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(meta.title)}</title>
  <style>
${cssText}
  </style>
</head>
<body>

<!-- ===== Page de garde ===== -->
<section class="cover" id="cover">
  <div class="cover-inner">
    <h1 class="cover-title">${escapeHtml(meta.title)}</h1>
    <p class="cover-subtitle">${escapeHtml(meta.subtitle)}</p>
    <p class="cover-authors">${escapeHtml(authorsStr)}</p>
  </div>
</section>

<!-- ===== Page de titre ===== -->
<section class="titlepage" id="titlepage">
  <h1 class="title">${escapeHtml(meta.title)}</h1>
  <p class="subtitle">${escapeHtml(meta.subtitle)}</p>
  <p class="authors">${escapeHtml(authorsStr)}</p>
</section>

<!-- ===== Sommaire ===== -->
<nav class="toc" id="toc">
  <h1 class="toc-title">Sommaire</h1>
  <ol class="toc-list">
${tocItems}
  </ol>
</nav>

<!-- ===== Corps ===== -->
<main class="body">
${chapters}
</main>

<!-- ===== Colophon ===== -->
<section class="colophon" id="colophon">
  <p class="colophon-title">${escapeHtml(meta.title)}</p>
  <p>${escapeHtml(authorsStr)}</p>
  <p class="colophon-note">Édition numérique générée à partir du site evasion-a-konigstein.site</p>
</section>

</body>
</html>
`;
}

// ------------------------------------------------------------------
// metadata.yaml pour Pandoc (EPUB)
// ------------------------------------------------------------------
function buildMetadata(meta) {
  return `---
title: "${meta.title.replace(/"/g, '\\"')}"
author:
${meta.authors.map((a) => `  - ${a}`).join('\n')}
lang: ${meta.lang}
description: "${meta.subtitle.replace(/"/g, '\\"')}"
---
`;
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
function main() {
  const lang = process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : 'fr';
  const meta = BOOK[lang];
  if (!meta) {
    console.error(`Langue « ${lang} » non supportée par le pipeline livre.`);
    process.exit(1);
  }

  const posts = loadPosts(lang);
  console.log(`→ ${posts.length} articles chargés (${lang})`);

  mkdirSync(OUT_DIR, { recursive: true });

  // manuscript.md (EPUB)
  const manuscript = buildManuscript(posts, meta);
  writeFileSync(join(OUT_DIR, 'manuscript.md'), manuscript, 'utf8');

  // book.html (PDF) — CSS embarquée inline pour éviter tout problème de résolution
  // de chemin (WeasyPrint utilise une base_url = public/ pour les images).
  const cssSrc = join(ROOT, 'src', 'styles', 'book.css');
  let cssText = '';
  if (existsSync(cssSrc)) {
    cssText = readFileSync(cssSrc, 'utf8');
    writeFileSync(join(OUT_DIR, 'book.css'), cssText, 'utf8');
  }
  const html = buildHtml(posts, meta, cssText);
  writeFileSync(join(OUT_DIR, 'book.html'), html, 'utf8');

  // metadata.yaml (EPUB)
  writeFileSync(join(OUT_DIR, 'metadata.yaml'), buildMetadata(meta), 'utf8');

  // Copie de la CSS déjà faite ci-dessus (pour référence / édition)

  console.log(`✓ dist/book/manuscript.md   (${(manuscript.length / 1024).toFixed(1)} Ko)`);
  console.log(`✓ dist/book/book.html       (${(html.length / 1024).toFixed(1)} Ko)`);
  console.log(`✓ dist/book/metadata.yaml`);
  console.log(`✓ dist/book/book.css`);
}

main();
