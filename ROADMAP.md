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

### Comment ajouter le contenu russe

1. Créer un fichier Markdown par chapitre dans `src/content/posts/ru/`
2. **Garder le même `slug`** que la version FR (ex. `leon.md`, `chapitre-2.md`, `4.md`, etc.)
3. Reprendre le même frontmatter que le FR, en changeant `lang: "ru"` et en traduisant `title` et `description` :

   ```yaml
   ---
   slug: "leon"
   title: "1. Когда возвращаются воспоминания"
   chapter: 1
   pubDatetime: 2020-03-19
   modDatetime: 2020-05-05
   description: "..."
   authors: ["Françoise", "Vladimir"]
   lang: "ru"
   ---
   ```

4. Le corps Markdown est la traduction russe. Les chemins d'images restent inchangés (`/content/images/...`).

### Ce qui se passe automatiquement

- Dès qu'un fichier RU existe pour un slug, la page `/ru/posts/<slug>/` est générée et rendue (police Lora pour le cyrillique).
- La page d'accueil `/ru/` et `/ru/histoire/` listent les chapitres traduits.
- Le sélecteur de langue s'active (lien FR ↔ RU cliquable) dès qu'**au moins un** chapitre RU existe.
- Les balises `hreflang` alternées ne sont émises que lorsque la traduction existe (pas de 404 SEO).

### Questions à trancher pour le RU
- [ ] Traduire les `title` / `description` ou garder les originaux français en attendant ?
- [ ] Faut-il des slugs translittérés en russe, ou conserver les slugs français (choix actuel : identiques) ?
- [ ] Le nom du site en russe est « Побег из Кёнигштайна » (à valider).

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
- [ ] Flux RSS Atom (l'ancien site avait `/rss/`)
- [ ] Page « À propos » / biographie des auteurs
- [ ] Optimisation images (générer des variantes responsive avec `astro:assets` au lieu des fichiers bruts)
- [ ] Open Graph images générées par chapitre
- [ ] Bouton « reprendre la lecture » (mémoriser le dernier chapitre lu)
