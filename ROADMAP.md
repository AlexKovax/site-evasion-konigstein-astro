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

## 📕 Pipeline livre PDF / EPUB (à brancher plus tard)

### Objectif
Assembler les chapitres Markdown dans l'ordre du récit pour produire un livre :
- **PDF** (impression / lecture)
- **EPUB** (liseuses)

### Prévu dans la structure
- Chaque article porte `chapter` (numéro) + `pubDatetime` dans son frontmatter → l'ordre du récit est déjà déterministe.
- Le contenu Markdown est du Markdown pur (titres, paragraphes, listes, blockquotes, images) → compatible Pandoc.

### Pipeline recommandé : Pandoc

Pandoc est l'outil le plus robuste pour un livre multilingue (FR/RU) avec une bonne typographie.

```bash
# 1. assembler les chapitres dans l'ordre (script à écrire : scripts/build-book.mjs)
#    -> dist/book/manuscript.md   (intro + chapitres 1..25, concaténés)

# 2. générer le PDF (via LaTeX, ex. xelatex pour le cyrillic)
pandoc dist/book/manuscript.md \
  -o dist/book/evasion-konigstein.pdf \
  --pdf-engine=xelatex \
  -V mainfont="Cardo" -V sansfont="Fira Sans" \
  -V geometry:a4paper -V lang=fr-FR \
  --toc --toc-depth=1 -N

# 3. générer l'EPUB
pandoc dist/book/manuscript.md \
  -o dist/book/evasion-konigstein.epub \
  --toc --toc-depth=1 \
  --metadata title="Évasion à Königstein" \
  --metadata author="Françoise; Vladimir"
```

### Tâches à réaliser quand on attaque le livre
- [ ] Écrire `scripts/build-book.mjs` : lit la collection `posts`, trie par `chapter`, concatène les corps Markdown, résout les images en chemins absolus, génère `dist/book/manuscript.md`.
- [ ] Définir une page de garde, une page de titre, un colophon.
- [ ] Choisir une mise en page LaTeX (classe `book` ou `memoir`), gérer les sauts de page par chapitre.
- [ ] Gérer les deux langues : un livre FR et un livre RU séparés (mêmes chapitres, contenu traduit).
- [ ] Gérer les images : pour le livre, embarquer les fichiers (pas des URLs web) → Pandoc le fait si les chemins sont locaux.
- [ ] Ajouter un script `npm run book:pdf` et `npm run book:epub` (nécessite Pandoc + LaTeX installés).
- [ ] Décider d'une couverture de livre (image `konig.jpg` ou une couverture dédiée).

### Alternative envisageable
Si on ne veut pas dépendre de Pandoc/LaTeX : solution JS (`md-to-pdf`, `epub-gen`). Moins bonne typographie, mais zéro dépendance système. **Recommandation : Pandoc** (validé par l'utilisateur).

---

## 🛠 Améliorations futures possibles (non prioritaires)

- [ ] Recherche full-text (ex. Pagefind) sur le contenu FR
- [ ] Flux RSS Atom (l'ancien site avait `/rss/`)
- [ ] Page « À propos » / biographie des auteurs
- [ ] Optimisation images (générer des variantes responsive avec `astro:assets` au lieu des fichiers bruts)
- [ ] Open Graph images générées par chapitre
- [ ] Bouton « reprendre la lecture » (mémoriser le dernier chapitre lu)
