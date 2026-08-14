# AGENTS.md

Contexte et instructions pour tout agent (humain ou IA) intervenant sur ce dépôt.
**Lis ce fichier en premier** avant toute intervention.

## Contexte du projet

**Evasion à Königstein** — récit historique en 25 chapitres + une introduction, écrit par
**Françoise & Vladimir**. Le site est la version web d'une histoire familiale vraie
(l'évasion du grand-père de la forteresse de Königstein en 1915, le fil conducteur menant
de Dannevoux à Moscou, Tachkent et Samarcande).

### Origine
- Anciennement un blog **Ghost 3.13** (thème « Edition »), exporté en site statique.
- L'export d'origine est dans `fichiersweb/` (non versionné, conservé localement comme
  source d'extraction). **Ne pas modifier ni committer ce dossier.**

### État actuel (v1.1)
- Site statique **Astro 7** (build `dist/`, 32 pages), multilingue **FR + RU** (RU = placeholders).
- 26 articles en Markdown dans `src/content/posts/fr/`, extraits via `scripts/extract.mjs`.
- Images dans `public/content/images/2020/` (originaux + 6 base64 décodés + `konig.jpg`).
- SEO : balises Open Graph + Twitter Card, JSON-LD (Article / WebSite), sitemap, robots.txt,
  flux RSS (`/rss.xml`), redirects 301, `llms.txt` + `llms-full.txt` pour le référencement IA.
- Images Markdown : lazy loading + dimensions injectées via rehype plugin (`src/plugins/rehype-images.ts`).
- Pages RU placeholders en `noindex` tant qu'aucun contenu RU n'est présent.
- Déployé sur **Netlify** : https://evasion-konigstein.netlify.app
- Repo GitHub : `AlexKovax/site-evasion-konigstein-astro`

### Stack
- **Astro 7** (static output) + `@astrojs/sitemap` + `@astrojs/rss`
- `@astrojs/markdown-remark` (pipeline remark/rehype pour le plugin d'images)
- Content Collections (`src/content.config.ts`) — un seul loader `glob` sur `src/content/posts`
- **Polices** via Fontsource : Cardo (serif FR) + Fira Sans (UI), Lora (serif cyrillique RU)
- **Pandoc** + **WeasyPrint** pour le livre PDF/EPUB (voir `ROADMAP.md`)

## Structure (essentielle)

```
src/
  consts.ts              # métadonnées site + chaînes i18n FR/RU  ← modifier ici pour le contenu global
  content.config.ts       # schéma de la collection « posts »
  lib/posts.ts            # helpers : récupérer/ordonner les articles par langue (tri par chapter)
  content/posts/
    fr/*.md               # articles FR (26)
    ru/*.md               # articles RU (à fournir — mêmes slugs que FR)
  layouts/
    BaseLayout.astro     # <head> : OG, Twitter Card, JSON-LD, hreflang, RSS, noindex
    PostLayout.astro     # article + JSON-LD Article + nav prev/next
  components/  pages/  styles/global.css
  plugins/rehype-images.ts  # lazy loading + width/height sur les images Markdown
  pages/
    404.astro             # page 404 personnalisée
    rss.xml.ts            # flux RSS (FR)
    llms-full.txt.ts      # contenu complet concaténé pour IA
scripts/extract.mjs      # extraction Ghost -> Markdown (déjà exécuté, re-exécutable)
scripts/build-book.mjs   # assemble les chapitres -> dist/book/ (PDF + EPUB)
scripts/setup-book.sh    # installe pandoc + weasyprint + polices (pipeline livre)
public/
  content/images/2020/    # images du récit (ne pas renommer : référencées par les .md)
  _redirects              # redirects 301 SEO — REGENERER si on ajoute/renomme un slug
  llms.txt                 # index Markdown pour LLM / référencement IA — REGENERER avec _redirects
  robots.txt               # autorise crawl + référence le sitemap
  humans.txt / ai.txt      # métadonnées humaines / politique IA
netlify.toml              # déploiement + headers + cache + CSP
ROADMAP.md                # feuille de route (contenu RU + pipeline livre)
README.md                 # doc projet
```

## Conventions à respecter

### Contenu
- Un article = un fichier `src/content/posts/<lang>/<slug>.md`.
- **Slugs identiques** entre FR et RU (seul le contenu change). Ne pas translittérer.
- Frontmatter obligatoire : `slug`, `title`, `chapter` (sauf intro), `pubDatetime`,
  `modDatetime`, `description`, `authors`, `lang`. Voir le schéma `content.config.ts`.
- `chapter` (entier) définit l'ordre du récit. L'article sans `chapter` (intro
  « Évasion à Königstein ») apparaît en **premier** dans les sommaires.
- Les chemins d'images dans le Markdown sont **absolus** (`/content/images/...`).
- **Auteurs partout** : `["Françoise", "Vladimir"]` (ne pas créer de page auteur).

### SEO
- Les **slugs historiques Ghost sont sacrés** : ne pas les renommer (référencement existant).
- Si on ajoute ou modifie un slug → **régénérer** `public/_redirects` (voir script de
  génération commenté en haut de ce fichier, ou le reconstruire à la main depuis la liste
  des `src/content/posts/fr/*.md`) **et** `public/llms.txt` (index pour LLM / référencement IA,
  liste tous les chapitres dans l'ordre avec leur URL canonique).
- **Open Graph + Twitter Card** : émises dans `BaseLayout.astro` sur toutes les pages.
  `PostLayout.astro` passe `ogType="article"` + `article:published_time` / `article:author`.
- **JSON-LD** : `WebSite` schema dans `BaseLayout.astro` (défaut), `Article` schema dans
  `PostLayout.astro` (passé via prop `jsonLd`).
- **Flux RSS** : `src/pages/rss.xml.ts` (FR uniquement). L'ancienne URL Ghost `/rss/`
  redirige vers `/rss.xml` en 301.
- **llms-full.txt** : `src/pages/llms-full.txt.ts` — contenu intégral concaténé des chapitres,
  généré automatiquement depuis la content collection (pas de maintenance manuelle).
- **Images Markdown** : le rehype plugin `src/plugins/rehype-images.ts` injecte
  `loading="lazy"`, `decoding="async"`, `width`, `height` (lectures des headers de fichiers).
- **Pages RU placeholders** : `noindex` tant qu'aucun post RU n'existe (prop `noindex` de
  `BaseLayout`). Le `noindex` est levé automatiquement quand des posts RU apparaissent.
- **Headers de sécurité** : HSTS, CSP, X-Frame-Options, Permissions-Policy dans `netlify.toml`.

### Design
- Styles globaux dans `src/styles/global.css` (tokens CSS custom properties).
- Pas de framework CSS. Scoped CSS dans les composants si besoin.
- Couleurs/typo via les variables `--color-*` et `--font-*` définies dans `:root`.
- Le mode sombre est géré par `@media (prefers-color-scheme: dark)`.
- Pour le RU, `--font-serif` bascule automatiquement sur Lora (Cardo n'a pas de cyrillique).

### i18n
- FR = locale par défaut, préfixée `/fr/`. RU préfixée `/ru/`.
- Les `hreflang` alternées ne sont émises **que si la traduction existe** (pas de 404 SEO).
- Le sélecteur de langue reste désactivé tant qu'aucun article RU n'est présent.
- Chaînes UI dans `src/consts.ts` → `UI.fr` / `UI.ru`. **Toujours renseigner les deux.**

## Commandes

```bash
npm install
npm run dev        # dev server http://localhost:4321
npm run build      # build statique -> dist/  (vérifier qu'il passe AVANT commit)
npm run preview    # prévisualiser le build
npm run extract    # ré-extraire les articles depuis fichiersweb/ (idempotent)

# Pipeline livre (nécessite pandoc + weasyprint : lancer d'abord scripts/setup-book.sh)
bash scripts/setup-book.sh   # install idempotente (sudo apt)
npm run book:pdf             # -> dist/book/evasion-konigstein.pdf  (WeasyPrint)
npm run book:epub            # -> dist/book/evasion-konigstein.epub (Pandoc)
npm run book                 # PDF + EPUB
```

**Node 22+** requis.

## Tenue à jour — OBLIGATIONS

### 1. Dépendances npm
- **Avant chaque intervention**, vérifier les mises à jour :
  ```bash
  npm outdated
  npx npm-check-updates -u   # optionnel : voir les majors dispo
  ```
- **Mettre à jour `astro` et les intégrations `@astrojs/*` régulièrement** (Astro évolue vite).
  Après chaque bump de version majeure d'Astro : lire la release notes, adapter la config
  (`astro.config.mjs`), l'API Content Collections (`content.config.ts`), et le rendu
  (`render()` depuis `astro:content` — a déjà changé entre v5 et v7).
- Après toute mise à jour : `npm run build` doit passer sans erreur ni warning.
- Mettre à jour les polices Fontsource si besoin (elles suivent Google Fonts).
- **Ne pas committer `package-lock.json` désynchronisé** : toujours `npm install` après
  avoir édité `package.json`.

### 2. Documentation
- **Tenir `ROADMAP.md` à jour** : cocher les tâches terminées, en ajouter les nouvelles.
  C'est le tableau de bord du projet (contenu RU, pipeline livre, améliorations futures).
- **Mettre à jour ce fichier `AGENTS.md`** si la stack, la structure, ou les conventions
  changent. Un agent qui arrive doit pouvoir tout comprendre en lisant uniquement ce fichier
  + `README.md` + `ROADMAP.md`.
- **Mettre à jour `public/_redirects`** à chaque ajout/retrait/renommage de slug d'article.
- **Mettre à jour `public/llms.txt`** en même temps (index pour LLM / référencement IA,
  qui liste les chapitres dans l'ordre avec leur URL canonique).
- Mettre à jour `src/consts.ts` (chaînes FR/RU) si on ajoute une page ou un élément d'UI.

### 3. Build & déploiement
- **Toujours vérifier `npm run build` avant de committer** (zéro erreur, zéro warning si possible).
- Le déploiement est automatique via Netlify à chaque push sur `master`.
- Après déploiement, vérifier les redirects 301 sur les anciennes URLs Ghost
  (ex. `curl -sI https://evasion-konigstein.netlify.app/leon/`).

## À venir (voir ROADMAP.md en détail)

1. **Contenu russe** — déposer les `.md` dans `src/content/posts/ru/` (mêmes slugs,
   `lang: "ru"`). Le site RU se construit automatiquement. Le pipeline livre gère
   déjà la langue via `node scripts/build-book.mjs --lang ru`.
2. **Pipeline livre PDF/EPUB** — opérationnel (`scripts/build-book.mjs` + WeasyPrint
   + Pandoc). Mise en page simple dans `src/styles/book.css`. Reste : optimiser le
   poids des images, préparer une version à imprimer, et une couverture dédiée.

## Pièges connus

- **Astro 7** : `post.render()` n'existe plus → utiliser `render(post)` de `astro:content`.
- **Astro 7 + rehype plugins** : Sätteri est le processeur Markdown par défaut. Pour utiliser
  `rehypePlugins`, installer `@astrojs/markdown-remark` (déjà fait). Un warning de dépréciation
  peut apparaître — non bloquant, à surveiller lors des futures migrations Astro.
- Le filtrage par langue se fait sur `e.data.lang === locale` (pas sur l'ID, dont le format
  dépend du loader glob).
- Certaines images Ghost n'existaient qu'en variante responsive (`content/images/size/w1920/`).
  `scripts/extract.mjs` les récupère via `ensureOriginal()` — si on ré-extrait, vérifier qu'aucune
  image n'est signalée manquante dans la sortie du script.
- L'export Ghost contenait des **images en base64** (data-URI) dans certains articles ; elles
  ont été décodées vers `public/content/images/2020/extraction/`.
