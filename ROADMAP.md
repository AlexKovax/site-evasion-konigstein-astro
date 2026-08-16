# Feuille de route — Evasion à Königstein

## État actuel (v1.0)

- ✅ Site statique Astro 7 (FR), build propre (31 pages)
- ✅ 26 articles extraits de l'ancien blog Ghost → Markdown dans `src/content/posts/fr/`
- ✅ Images récupérées dans `public/content/images/2020/` (originaux + 6 images base64 décodées)
- ✅ Design repris du thème Ghost « Edition » : Cardo + Fira Sans, accent #e05431, mode sombre, layout centré
- ✅ Accueil = présentation du récit + sommaire chronologique (intro + 25 chapitres)
- ✅ Page `/histoire` = sommaire chronologique
- ✅ Navigation prev/next entre chapitres (ordre du récit)
- ✅ Slugs historiques conservés + redirects 301 (Netlify `public/_redirects`)
- ✅ Sitemap + hreflang FR/RU
- ✅ Architecture i18n FR + RU (prête, contenu RU à fournir)
- ✅ Auteurs « Françoise & Vladimir » partout
- ✅ Déploiement Netlify (`netlify.toml`)

---

## 📗 Étape suivante — Version russe (RU)

### État

- ✅ **1ʳᵉ partie (intro + chapitres 1-10)** intégrée — voir
  [`scripts/INTEGRATION-RU.md`](scripts/INTEGRATION-RU.md) pour la procédure
  complète (extraction pandoc → découpage → création des fichiers RU →
  vérifications). Re-productible telle quelle pour la suite.
- ⬜ **2ᵉ partie (chapitres 11-25)** : en attente du docx `evasion_2_partie.docx`.
  La table de correspondance slug -> fichier FR est dans l'annexe de
  `scripts/INTEGRATION-RU.md`.

### Comment ajouter le contenu russe

Voir [`scripts/INTEGRATION-RU.md`](scripts/INTEGRATION-RU.md) — guide détaillé
pour intégrer un fichier `.docx` de traduction russe. Résumé :

1. Déposer le `.docx` dans `tmp/` (non versionné).
2. `pandoc` pour extraire le Markdown (`scripts/INTEGRATION-RU.md` §2).
3. `split.mjs` (script de référence §4) pour découper en sections par chapitre.
4. Pour chaque section, créer `src/content/posts/ru/<slug>.md` en reprenant le
   frontmatter du FR correspondant (slug, chapter, dates, authors) + `lang: "ru"`,
   traduire `title` et `description`, injecter les **mêmes images** que le FR
   aux positions sémantiques équivalentes.
5. `npm run build` + vérifications (§6).
6. Mettre à jour `public/llms.txt` (§7) et cocher ici.

---

## 📕 Pipeline livre PDF / EPUB

### ✅ Fait (v1.1)

Le pipeline est opérationnel. Sorties produites dans `dist/book/` :

| Fichier | Format | Moteur |
|---|---|---|
| `evasion-konigstein.pdf` | A4, 117 p. | **WeasyPrint** (rendu HTML/CSS) |
| `evasion-konigstein.epub` | liseuses | **Pandoc** (depuis Markdown) |

**Mise en page** (simple et agréable à lire) : page de garde sombre, page de
 titre, sommaire, chapitres avec saut de page et en-tête numéroté, colophon.
 Police de corps Cardo, titres Fira Sans, accent `#e05431` (couleurs du site).

### Stack choisie

- **WeasyPrint** (plutôt que xelatex) pour le PDF : installation légère, mise en
  page pilotée par CSS (`src/styles/book.css`), gestion native du cyrillique
  (police Lora) quand le contenu RU arrivera.
- **Pandoc** pour l'EPUB (chemin natif) et pour la conversion Markdown → HTML
  intermédiaire du PDF.
- Polices Cardo / Fira Sans / Lora copées depuis `@fontsource` vers
  `~/.local/share/fonts` par `scripts/setup-book.sh`.

### Commandes

```bash
bash scripts/setup-book.sh          # installe pandoc + weasyprint + polices (sudo apt)
npm run book:html                   # assemble -> dist/book/ (book.html + manuscript.md)
npm run book:pdf                    # build + rendu WeasyPrint -> .pdf
npm run book:epub                   # build + Pandoc -> .epub
npm run book                        # PDF + EPUB d'un coup
node scripts/build-book.mjs --lang ru   # (futur) version russe
```

### Fichiers du pipeline

- `scripts/setup-book.sh` — installation idempotente des dépendances système.
- `scripts/build-book.mjs` — lit `src/content/posts/<lang>/*.md`, trie par
  `chapter` (intro en premier), génère `dist/book/manuscript.md` (EPUB) et
  `dist/book/book.html` (PDF, CSS embarquée inline).
- `src/styles/book.css` — mise en page print (A4, marges, couverture, sommaire,
  chapitres, colophon).

### Tâches restantes / améliorations

- [ ] **Optimiser le poids** : le PDF fait 64 Mo et l'EPUB 72 Mo à cause des
  PNG Ghost très lourds (certains > 12 Mo). Downscaler les images à max ~1600 px
  et réencoder en JPEG avant intégration.
- [ ] Version à imprimer : marges de reliure, lignes de fond, numéros de page
  référentiels dans le sommaire (via `target-counter`), sauts de page pairs/impairs.
- [ ] Couverture dédiée (au lieu de `konig.jpg` brut en couverture EPUB).
- [ ] Version russe : `npm run book:pdf -- --lang ru` dès que `src/content/posts/ru/` est rempli.
- [ ] Warning Pandoc sur l’image de couverture (« could not determine image size ») —
  non bloquant, à investiguer.

---

## 🛠 Améliorations futures possibles (non prioritaires)

- [ ] Recherche full-text (ex. Pagefind) sur le contenu FR
- [x] Flux RSS Atom (`/rss.xml` — l'ancien site avait `/rss/`, redirigé en 301)
- [x] Balises Open Graph + Twitter Card + JSON-LD (Article / WebSite)
- [x] `llms.txt` + `llms-full.txt` pour le référencement IA
- [x] `robots.txt` référençant le sitemap
- [x] Page 404 personnalisée
- [x] Images Markdown : lazy loading + width/height (rehype plugin)
- [x] Pages RU placeholders en `noindex`
- [x] Headers de sécurité (HSTS, CSP, Permissions-Policy)
- [ ] Page « À propos » / biographie des auteurs
- [ ] Optimisation images (générer des variantes responsive avec `astro:assets` au lieu des fichiers bruts)
- [ ] Open Graph images générées par chapitre
- [ ] Bouton « reprendre la lecture » (mémoriser le dernier chapitre lu)
- [ ] Texte `alt` descriptif sur les images du récit (actuellement vide)
