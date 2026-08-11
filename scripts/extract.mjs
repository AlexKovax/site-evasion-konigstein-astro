// scripts/extract.mjs
// Extraction du contenu du site Ghost statique (fichiersweb/) vers
// des fichiers Markdown Astro Content Collections (src/content/posts/fr/).
//
// Pour chaque article <slug>/index.html :
//  - lit le bloc JSON-LD @type:Article (titre, dates, description, auteur)
//  - détermine le numéro de chapitre (depuis le titre "N. ...")
//  - extrait <section class="post-content">...</section>
//  - convertit le HTML en Markdown (turndown)
//  - décode les images base64 -> fichiers dans public/content/images/2020/extraction/
//  - réécrit les src d'images vers /content/images/...
//  - écrit src/content/posts/fr/<slug>.md avec frontmatter YAML
//
// Usage : node scripts/extract.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'fichiersweb');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'posts', 'fr');
const IMG_OUT = path.join(ROOT, 'public', 'content', 'images', '2020', 'extraction');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(IMG_OUT, { recursive: true });

const SKIP = new Set(['assets', 'content', 'author', 'rss', 'histoire']);

const ENTITIES = {
  quot: '"', amp: '&', apos: "'", lt: '<', gt: '>',
  hellip: '…', nbsp: '\u00A0', bull: '•', laquo: '«', raquo: '»',
  mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
};
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(\w+);/g, (_, name) => (name in ENTITIES ? ENTITIES[name] : `&${name};`));
}

function htmlToMarkdown(nodeHtml) {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  });

  // Images : sortie Markdown avec alt, on gère le src à part (rewrite).
  td.addRule('kgImage', {
    filter: (node) =>
      node.nodeName === 'IMG' && (node.className?.includes('kg-image') || true),
    replacement: (_content, node) => {
      const src = node.getAttribute('src') || '';
      const alt = (node.getAttribute('alt') || '').trim();
      if (!src) return '';
      return `\n\n![${alt}](${src})\n\n`;
    },
  });

  // Figures : on extrait l'image + la figcaption éventuelle en légende (*italique*).
  td.addRule('kgFigure', {
    filter: (node) =>
      node.nodeName === 'FIGURE' &&
      (node.className?.includes('kg-image-card') || node.className?.includes('kg-gallery-card')),
    replacement: (_content, node) => {
      const img = node.querySelector('img');
      const caption = node.querySelector('figcaption');
      const out = [];
      if (img) {
        const src = img.getAttribute('src') || '';
        const alt = (img.getAttribute('alt') || '').trim();
        if (src) out.push(`\n\n![${alt}](${src})\n\n`);
      }
      // galerie : plusieurs images
      const imgs = node.querySelectorAll('img');
      if (imgs && imgs.length > 1) {
        out.length = 0;
        for (const im of imgs) {
          const src = im.getAttribute('src') || '';
          const alt = (im.getAttribute('alt') || '').trim();
          if (src) out.push(`\n\n![${alt}](${src})\n\n`);
        }
      }
      if (caption) {
        const cap = caption.textContent.trim();
        if (cap) out.push(`\n\n*${cap}*\n\n`);
      }
      return out.join('');
    },
  });

  return td.turndown(nodeHtml);
}

// Détermine le numéro de chapitre depuis un titre "12. ..." ou "12 ." ...
function parseChapter(title) {
  const m = title.match(/^\s*(\d+)\s*[\.\)]/);
  return m ? parseInt(m[1], 10) : null;
}

function extractJsonLd(html) {
  const m = html.match(
    /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

let b64Counter = 0;
const ensured = new Set();
function ensureOriginal(rel) {
  // rel ex: "2020/04/konig.jpg"
  const dest = path.join(ROOT, 'public', 'content', 'images', rel);
  if (ensured.has(dest) || fs.existsSync(dest)) { ensured.add(dest); return; }
  // tenter d'abord l'original, puis la variante w1920
  const candidates = [
    path.join(SRC, 'content', 'images', rel),
    path.join(SRC, 'content', 'images', 'size', 'w1920', rel),
    path.join(SRC, 'content', 'images', 'size', 'w960', rel),
    path.join(SRC, 'content', 'images', 'size', 'w640', rel),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(c, dest);
      ensured.add(dest);
      console.log(`  + original copié : ${rel} (depuis ${path.relative(SRC, c)})`);
      return;
    }
  }
  console.warn(`  ! image introuvable dans fichiersweb : ${rel}`);
}

function processImageSrc(src, slug) {
  // Cas 0 : srcset/variantes responsive Ghost -> on ne garde que l'original pleine
  // résolution (w1920). Si l'original n'existe pas dans public/, on le copie depuis
  // fichiersweb/content/images/size/w1920/... (certaines images n'existent qu'en
  // variante responsive, ex. konig.jpg).
  // (géré plus bas via ensureOriginal)
  // Cas 1 : image fichier -> ../content/images/2020/xx/... ou content/images/...
  const fileMatch = src.match(/content\/images\/(?:size\/w\d+\/)?(.+)$/);
  if (fileMatch) {
    const rel = fileMatch[1];
    ensureOriginal(rel);
    return '/content/images/' + rel;
  }
  // Cas 2 : data:image/...;base64 -> décoder et sauver
  const b64Match = src.match(/^data:image\/(\w+);base64,(.+)$/);
  if (b64Match) {
    const ext = b64Match[1] === 'jpeg' ? 'jpg' : b64Match[1];
    b64Counter++;
    const name = `${slug}-${String(b64Counter).padStart(2, '0')}.${ext}`;
    const buf = Buffer.from(b64Match[2], 'base64');
    fs.writeFileSync(path.join(IMG_OUT, name), buf);
    return `/content/images/2020/extraction/${name}`;
  }
  return src;
}

function rewriteImageSrcs(html, slug) {
  return html.replace(/(<img[^>]*\bsrc=")([^"]*)(")/g, (m, pre, src, post) => {
    return pre + processImageSrc(src, slug) + post;
  });
}

function extractPost(dir, slug) {
  const file = path.join(dir, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const json = extractJsonLd(html);

  const title = decodeEntities(json?.headline || '');
  const description = json?.description ? decodeEntities(json.description) : '';
  const publishedAt = json?.datePublished || '';
  const updatedAt = json?.dateModified || publishedAt;

  // Contenu : <section class="post-content">...</section>
  const cm = html.match(/<section class="post-content">([\s\S]*?)<\/section>/);
  if (!cm) {
    console.warn(`  ! pas de post-content pour ${slug}`);
    return null;
  }
  let contentHtml = cm[1].trim();
  // réécriture des src d'images
  contentHtml = rewriteImageSrcs(contentHtml, slug);

  // turndown n'aime pas forcément <br> isolés ; on normalise
  contentHtml = contentHtml.replace(/<br\s*\/?>/g, '\n');

  const markdown = htmlToMarkdown(contentHtml).trim();

  const chapter = parseChapter(title);

  // date fr lisible pour le frontmatter (YYYY-MM-DD)
  const pubDate = publishedAt ? publishedAt.slice(0, 10) : '';
  const updDate = updatedAt ? updatedAt.slice(0, 10) : '';

  const fm = [
    '---',
    `slug: "${slug}"`,
    `title: ${JSON.stringify(title)}`,
    chapter !== null ? `chapter: ${chapter}` : null,
    `pubDatetime: ${pubDate}`,
    `modDatetime: ${updDate}`,
    description ? `description: ${JSON.stringify(description)}` : null,
    `authors: ["Françoise", "Vladimir"]`,
    `lang: "fr"`,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  const out = `${fm}\n\n${markdown}\n`;
  const outFile = path.join(OUT_DIR, `${slug}.md`);
  fs.writeFileSync(outFile, out);
  return { slug, title, chapter, pubDate };
}

function main() {
  const entries = fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP.has(e.name));

  const results = [];
  for (const e of entries) {
    const slug = e.name;
    const dir = path.join(SRC, slug);
    if (!fs.existsSync(path.join(dir, 'index.html'))) continue;
    try {
      const r = extractPost(dir, slug);
      if (r) results.push(r);
    } catch (err) {
      console.error(`  ! erreur ${slug}:`, err.message);
    }
  }

  // tri par chapitre puis date pour le rapport
  results.sort((a, b) => {
    if (a.chapter !== null && b.chapter !== null) return a.chapter - b.chapter;
    if (a.chapter === null && b.chapter !== null) return 1;
    if (a.chapter !== null && b.chapter === null) return -1;
    return a.pubDate.localeCompare(b.pubDate);
  });

  console.log(`\n✓ ${results.length} articles extraits vers ${path.relative(ROOT, OUT_DIR)}/`);
  console.log(`✓ ${b64Counter} images base64 décodées vers ${path.relative(ROOT, IMG_OUT)}/`);
  console.log('\nOrdre du récit :');
  for (const r of results) {
    console.log(
      `  ${r.chapter !== null ? String(r.chapter).padStart(2, '0') : '--'}.  [${r.pubDate}]  ${r.slug}  —  ${r.title}`
    );
  }
}

main();
