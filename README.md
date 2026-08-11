# Evasion à Königstein — site Astro

Site statique multilingue (FR / RU) du récit *Évasion à Königstein*, par Françoise & Vladimir.
Migré depuis un ancien blog Ghost (export statique dans `fichiersweb/`, non versionné).

## Démarrage

```bash
npm install
npm run dev        # serveur local http://localhost:4321
npm run build      # build statique -> dist/
npm run preview    # prévisualiser le build
```

> Node 22+ requis.

## Structure

```
src/
  content/
    config.ts            # schéma de la collection « posts »
    posts/
      fr/                # 26 articles en français (extrait de Ghost)
      ru/                # articles russes (à fournir)
  consts.ts             # métadonnées du site + chaînes i18n FR/RU
  lib/posts.ts           # helpers : récupérer/ordonner les articles par langue
  layouts/
    BaseLayout.astro     # <head>, header, footer, polices
    PostLayout.astro     # page article (chapitre, prose, nav prev/next)
  components/
    Header.astro         # nav + sélecteur de langue
    Footer.astro
  pages/
    index.astro          # racine -> redirige vers /fr/
    fr/
      index.astro        # accueil : récit + sommaire chronologique
      histoire.astro     # sommaire chronologique
      posts/[slug].astro # page article
    ru/                  # même structure (placeholders « traduction à venir »)
  styles/
    global.css           # tokens couleurs/typo + styles (mode sombre)
public/
  content/images/2020/   # images du récit (originales + extraction base64)
  favicon.ico
  _redirects             # redirects 301 SEO (anciennes URLs Ghost -> /fr/...)
netlify.toml             # déploiement Netlify
ROADMAP.md               # feuille de route (version RU + pipeline livre PDF/EPUB)
scripts/
  extract.mjs            # extraction Ghost -> Markdown (déjà exécuté)
```

## i18n

- FR est la locale par défaut, préfixée `/fr/`.
- RU est préfixée `/ru/`. Tant que `src/content/posts/ru/` est vide, les pages RU affichent « traduction à venir » et le sélecteur de langue côté FR reste désactivé.
- Les slugs sont **identiques** entre FR et RU (seul le contenu change). Voir `ROADMAP.md` pour ajouter le contenu russe.

## SEO / redirections

Les slugs historiques Ghost sont conservés (`leon`, `chapitre-2`, `4`, `24-octobre-2020-...`, etc.).
`public/_redirects` (Netlify) renvoie les anciennes URLs vers `/fr/posts/<slug>/` en 301.

## Contenu

Les articles sont des Content Collections Astro (Markdown + frontmatter).
Le champ `chapter` (numéro) définit l'ordre du récit ; l'article « Évasion à Königstein » (sans numéro) sert d'introduction et apparaît en premier.

## Pipeline livre (PDF / EPUB)

Prévu dans `ROADMAP.md` — assemblage via **Pandoc** (non branché pour l'instant).
