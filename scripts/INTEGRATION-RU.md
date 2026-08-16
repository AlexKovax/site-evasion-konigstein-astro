# Procédure — Intégration d'un fichier docx de traduction russe

Ce document décrit la méthode utilisée pour intégrer la traduction russe du
récit fournie en un fichier `.docx` unique contenant plusieurs chapitres.
Appliquée une première fois pour la 1ʳᵉ partie (introduction + chapitres 1-10),
elle est reproductible telle quelle pour la suite (chapitres 11-25).

## 1. Contexte

- Le traducteur livre un `.docx` par « partie » du récit (ex. `evasion_1_partie.docx`,
  `evasion_2_partie.docx`, …). Chaque partie contient plusieurs chapitres
  concaténés, repérés par un titre en gras `**N. …**` (ou `Введение.` pour l'intro).
- Le docx ne contient **aucune image** — seulement des balises `[IMAGE]` comme
  marqueurs d'emplacement. Les images réelles sont déjà dans
  `public/content/images/2020/` et référencées dans les posts FR ; on les
  réutilise à l'identique (assets partagés FR/RU, chemins absolus `/content/...`).
- Le docx est déposé dans `tmp/` (dossier de travail, **non versionné** — voir
  `.gitignore`).

## 2. Extraction du docx en Markdown

```bash
mkdir -p /tmp/opencode/docx_extract
pandoc -f docx -t markdown tmp/evasion_<N>_partie.docx \
  -o /tmp/opencode/docx_extract/full.md \
  --extract-media=/tmp/opencode/docx_extract/media
```

`pandoc` est déjà installé (voir `scripts/setup-book.sh`). L'option
`--extract-media` n'est pas strictement nécessaire (le docx n'a pas d'images
embarquées) mais ne coûte rien.

## 3. Découpage en sections

Le fichier Markdown produit contient tous les chapitres à la suite. On les
découpe en un fichier par section, en réassemblant les paragraphes que pandoc
casse en sauts de ligne parasites (un paragraphe = plusieurs lignes courtes
séparées par des lignes vides, sans logique de fin de phrase).

Le script `/tmp/opencode/docx_extract/split.mjs` fait ce travail :

```bash
node /tmp/opencode/docx_extract/split.mjs
# -> /tmp/opencode/docx_extract/sec-0.md (intro)
# -> /tmp/opencode/docx_extract/sec-1.md (chapitre 1)
# -> ...
# -> /tmp/opencode/docx_extract/sec-N.md (dernier chapitre du docx)
```

### Logique de réassemblage des paragraphes

pandoc insère des lignes vides au milieu des paragraphes (retours à la ligne
orphelins de Word). Le script `split.mjs` les réassemble avec cette heuristique :

- On joint les lignes non vides consécutives avec une espace.
- Une ligne vide crée un nouveau paragraphe **uniquement si** la dernière ligne
  du paragraphe en cours se termine par une ponctuation de fin de phrase
  (`.` `!` `?` `…`), **ou** si l'une des deux lignes est un bloc italique/gras
  standalone (frontière de bloc), **ou** si la ligne suivante est un tiret de
  dialogue (`— ` ou `\- `).
- Sinon la ligne vide est ignorée et le paragraphe continue.

Cette heuristique a été ajustée sur la 1ʳᵉ partie et donne de bons résultats.
En cas de souci sur une nouvelle partie, le test rapide est :
`node split.mjs && head -60 sec-N.md` et vérifier visuellement.

> **Note** : le script `split.mjs` n'est pas versionné dans le dépôt (il vit
> dans `/tmp/opencode/`). Pour le retrouver, voir le commit `e5369c3` (historique
> Git) ou le réécrire depuis la section 4 de ce document qui reproduit son
> contenu. **TODO** : le ranger dans `scripts/` pour qu'il soit versionné.

## 4. Contenu du script `split.mjs` (de référence)

```javascript
// Découpe le markdown pandoc en sections (intro + chN..chM) et réassemble
// les paragraphes que pandoc casse en sauts de ligne parasites.
import { readFileSync, writeFileSync } from 'node:fs';

const raw = readFileSync('/tmp/opencode/docx_extract/full.md', 'utf8');
const lines = raw.split('\n');

// Repère les index de début de chaque section (titre en gras **N. …** ou Введение.)
const markers = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (/^\*\*\d+\./.test(l) || /^Введение\.$/.test(l)) {
    markers.push({ i, title: l.replace(/^\*\*|\*\*$/g, '') });
  }
}

function joinParas(lines) {
  const isSentenceEnd = (t) => /[.!?]$|\.{3}$|\\?\.\.\.$/.test(t);
  const isItalic = (t) => /^\*[^*].*\*$/.test(t) || /^_[^_].*_$/.test(t);
  const isStandaloneBlock = (t) => isItalic(t) || /^\*\*.+\*\*$/.test(t);
  const isDialogue = (t) => /^\\?-{1,2}\s/.test(t) || /^—\s/.test(t);
  const paras = [];
  let cur = [];
  const flush = () => { if (cur.length) { paras.push(cur.join(' ')); cur = []; } };
  let pendingBlank = false;
  for (const l of lines) {
    const t = l.trim();
    if (t === '') { pendingBlank = true; continue; }
    if (pendingBlank) {
      const last = cur.length ? cur[cur.length - 1] : '';
      const lastIt = isStandaloneBlock(last);
      const tIt = isStandaloneBlock(t);
      let doFlush = false;
      if (lastIt && tIt) doFlush = false;          // même bloc italique -> on joint
      else if (lastIt || tIt) doFlush = true;       // frontière de bloc
      else if (isSentenceEnd(last) || isDialogue(t)) doFlush = true;
      if (doFlush) flush();
      pendingBlank = false;
    }
    cur.push(t);
  }
  flush();
  return paras.join('\n\n');
}

function cleanSection(start, end) {
  return joinParas(lines.slice(start + 1, end));
}

const sections = [];
for (let k = 0; k < markers.length; k++) {
  const start = markers[k].i;
  const end = k + 1 < markers.length ? markers[k + 1].i : lines.length;
  const body = cleanSection(start, end);
  sections.push({ title: markers[k].title, body });
  writeFileSync(`/tmp/opencode/docx_extract/sec-${k}.md`, body);
}
console.log(sections.map((s, i) => `${i}: ${s.title} (${s.body.length} chars)`).join('\n'));
```

## 5. Création des fichiers RU

Pour chaque section `sec-N.md`, créer le fichier `src/content/posts/ru/<slug>.md`
où `<slug>` est le **même slug** que le chapitre FR correspondant.

### Mapping chapitre -> slug -> fichier FR de référence

La table de correspondance est obtenue par :

```bash
for f in src/content/posts/fr/*.md; do
  grep -H "^slug:\|^title:\|^chapter:" "$f"
done
```

Pour la 1ʳᵉ partie :

| Section docx | Fichier RU à créer | Slug | Fichier FR de référence (images + frontmatter) |
|---|---|---|---|
| intro (Введение) | `evasion-a-konigstein.md` | `evasion-a-konigstein` | `src/content/posts/fr/evasion-a-konigstein.md` |
| ch1 | `leon.md` | `leon` | `fr/leon.md` |
| ch2 | `chapitre-2.md` | `chapitre-2` | `fr/chapitre-2.md` |
| ch3 | `chapitre-3.md` | `chapitre-3` | `fr/chapitre-3.md` |
| ch4 | `4.md` | `4` | `fr/4.md` |
| ch5 | `5-3-jours-en-aout-14.md` | `5-3-jours-en-aout-14` | `fr/5-3-jours-en-aout-14.md` |
| ch6 | `6-corriger-wikipedia.md` | `6-corriger-wikipedia` | `fr/6-corriger-wikipedia.md` |
| ch7 | `6-la-bande.md` | `6-la-bande` | `fr/6-la-bande.md` |
| ch8 | `8.md` | `8` | `fr/8.md` |
| ch9 | `9.md` | `9` | `fr/9.md` |
| ch10 | `chapitre-10.md` | `chapitre-10` | `fr/chapitre-10.md` |

### Frontmatter

Reprendre du FR correspondant : `slug`, `chapter`, `pubDatetime`, `modDatetime`,
`authors`. Traduire `title` et `description` en russe (la `description` sert pour
SEO/OG/RSS — garder un extrait court du contenu RU, ou traduire la description
FR). Ajouter `lang: "ru"`.

```yaml
---
slug: "leon"
title: "1. Когда возвращаются воспоминания"
chapter: 1
pubDatetime: 2020-03-19
modDatetime: 2020-05-05
description: "Из моего дневника, осень 2014\n\n> ..."
authors: ["Françoise", "Vladimir"]
lang: "ru"
---
```

### Corps du texte

- Texte russe nettoyé (paragraphes réassemblés par `split.mjs`).
- Préserver la mise en forme sémantique :
  - `_italique_` pour les citations du journal de Françoise, les légendes d'images,
    les titres d'œuvres.
  - `**gras**` pour les noms d'officiers dans les récits historiques (ch5).
  - `> ` blockquote pour les citations externes courtes (Maurice Genevoix ch1,
    Sam Mendes intro, Roland Dorgelès ch5).
- Pour les **transcriptions longues** (lettre du ch3, rapport Croix-Rouge du ch9),
  ne pas utiliser de blockquote (qui rendrait toute la page en citation) mais
  encapsuler dans une boîte `.document` :

  ```markdown
  <div class="document">

  <span class="doc-label">Транскрипция письма</span>

  «Texte de la lettre...»

  </div>
  ```

  Le style `.document` est défini dans `src/styles/global.css` (bordure grise,
  fond doux, label en majuscules) pour distinguer visuellement les documents
  transcrits du récit.

### Images

Pour chaque chapitre, **injecter toutes les images du FR** aux positions
sémantiquement équivalentes, en s'aidant :

1. Des balises `[IMAGE]` du docx comme ancres (le traducteur les a placées aux
   bons endroits, mais peut en avoir condensé plusieurs en une seule).
2. Des légendes italiques adjacentes (`*Légende...*`) qui décrivent souvent
   l'image et permettent de l'identifier.
3. Du fichier FR de référence, qui liste toutes les images dans l'ordre.

Les chemins d'images sont **absolus et inchangés** : `![](/content/images/2020/...)`.
Les assets sont partagés FR/RU (aucune image à dupliquer).

**Choix retenu** : quand le RU a moins de `[IMAGE]` que le FR n'a d'images, on
**préserve toutes les images du FR** en les insérant aux positions les plus
pertinentes dans le flux RU (confirmé par l'utilisateur). C'est un plus pour le
lecteur russe et ça garantit la cohérence visuelle entre versions.

### Mise en forme typographique

Quelques normalisations appliquées systématiquement :

- Guillemets français `« »` → guillemets russes `« »` (déjà bons dans le docx).
- Tirets de dialogue : `---` (pandoc) → `—` (cadratin) pour le rendu RU.
- Points de suspension : `\...` (pandoc échappé) → `...`.
- Espaces fines insécables avant `:` `;` `?` `!` `»` : laissées au choix du
  traducteur dans le docx, on ne les modifie pas.
- Début de paragraphe : supprimer l'espace après `*` d'ouverture d'un bloc
  italique si pandoc l'a laissé (ex: `* «Оказалось` → `*«Оказалось`).

## 6. Vérifications

```bash
npm run build
```

Doit passer sans erreur ni warning (à part le warning de dépréciation
`markdown.remarkPlugins` pré-existant, non bloquant). Le nombre de pages
construites doit augmenter du nombre de chapitres RU ajoutés.

### Points à vérifier après build

- **`noindex`** levé sur les pages RU (les pages RU ne sont plus en noindex dès
  qu'il existe au moins un post RU — voir `BaseLayout.astro`) :
  ```bash
  grep -c "noindex" dist/ru/index.html   # doit être 0
  ```
- **`hreflang` FR↔RU croisés** sur les articles traduits :
  ```bash
  grep -oE 'hreflang="ru" href="[^"]*"' dist/fr/posts/<slug>/index.html
  grep -oE 'hreflang="fr" href="[^"]*"' dist/ru/posts/<slug>/index.html
  ```
- **Bouton de changement de langue** présent sur les articles ayant une
  traduction, absent sinon (voir `PostLayout.astro`) :
  ```bash
  grep -c 'translate-btn' dist/fr/posts/<slug>/index.html   # 1 si traduit, 0 sinon
  ```
- **Sitemap** : URLs RU présentes :
  ```bash
  grep -oE "https://[^< ]+/ru/posts/[a-z0-9-]+/" dist/sitemap-0.xml | sort -u
  ```
- **`llms-full.txt`** : régénéré automatiquement depuis la content collection
  (pas de maintenance manuelle).

## 7. Mises à jour connexes

- **`public/llms.txt`** : mettre à jour la description de la couverture RU
  (ex. « version russe partielle : intro + chap. 1-10 » → « ... 1-25 » une fois
  complet). Ce fichier est index Markdown pour LLM / référencement IA.
- **`public/_redirects`** : **pas à modifier**. Les slugs RU sont identiques aux
  slugs FR, et les redirects 301 ne concernent que les anciennes URLs Ghost
  (qui pointent vers `/fr/`). Aucun ancrage SEO côté RU.
- **`ROADMAP.md`** : cocher la case correspondante dans la section RU.

## 8. Commit

Le dossier `tmp/` est dans `.gitignore` (depuis le commit `e5369c3`) : le docx
et les extractions ne sont jamais committés.

```bash
git add .gitignore public/llms.txt src/content/posts/ru/ ROADMAP.md
git commit -m "feat(i18n): traduction russe chapitres 11-25"
git push
```

Le déploiement Netlify se lance automatiquement sur `master`.

## 9. Pièges connus

- **Collision des slugs FR/RU dans le `glob loader` d'Astro** : par défaut,
  `generateIdDefault` utilise le champ `slug` du frontmatter comme **id** de
  collection (`node_modules/astro/dist/content/loaders/glob.js:10`). Comme FR
  et RU partagent les mêmes slugs, ils collisionnent et **les pages FR
  correspondantes disparaissent silencieusement du build**. Le correctif est en
  place dans `src/content.config.ts` : `generateId` basé sur le chemin relatif
  (`<lang>/<slug>`). Si on migre vers une nouvelle version majeure d'Astro,
  vérifier que ce fix tient toujours (l'API du glob loader peut changer).

- **Blockquote pour les transcriptions longues** : ne pas mettre une lettre
  complète ou un rapport complet en `>` blockquote — ça rend toute la page en
  citation visuellement. Utiliser la boîte `.document` (section 5).

- **Paragraphes cassés par pandoc** : si le build affiche des paragraphes
  étrangement courts ou collés, c'est que l'heuristique de `split.mjs` n'a pas
  bien marché sur un cas particulier. Ajuster `isSentenceEnd` / `isStandaloneBlock`
  / `isDialogue` dans le script (section 4) au besoin.

- **Description du frontmatter trop longue** : le champ `description` alimente
  `og:description` et `twitter:description`. Garder un extrait court (3-6 lignes)
  plutôt que toute la description FR qui peut être très longue.

---

## Annexe — Référence rapide pour la 2ᵉ partie (chapitres 11-25)

Le second docx (`evasion_2_partie.docx`) est attendu avec les chapitres 11-25.
Voici la table de correspondance slug -> fichier FR à préparer :

| Chapter | Slug | Fichier FR de référence |
|---|---|---|
| 11 | `la-lettre-de-vladimir` | `fr/la-lettre-de-vladimir.md` |
| 12 | `10-retour-a-koenigstein` | `fr/10-retour-a-koenigstein.md` |
| 13 | `12-vladimir-gabbine-je-vous-passe-son-fils` | `fr/12-vladimir-gabbine-je-vous-passe-son-fils.md` |
| 14 | `13-noel-chez-gabbine` | `fr/13-noel-chez-gabbine.md` |
| 15 | `13-avant-1914-une-famille-russe-a-turkestan` | `fr/13-avant-1914-une-famille-russe-a-turkestan.md` |
| 16 | `16` | `fr/16.md` |
| 17 | `17-la-famille-gabbine-vivre-dals-la-russie-nouvelle` | `fr/17-la-famille-gabbine-vivre-dals-la-russie-nouvelle.md` |
| 18 | `18-tachkent` | `fr/18-tachkent.md` |
| 19 | `vivre-dans-la-russie-nouvelle` | `fr/vivre-dans-la-russie-nouvelle.md` |
| 20 | `18-comprendre-le-passe` | `fr/18-comprendre-le-passe.md` |
| 21 | `21-passe` | `fr/21-passe.md` |
| 22 | `22-leon-et-vladimir-notre-histoire` | `fr/22-leon-et-vladimir-notre-histoire.md` |
| 23 | `23-aout-2020-retour-a-konigstein` | `fr/23-aout-2020-retour-a-konigstein.md` |
| 24 | `24-octobre-2020-le-rapport-du-colonel-...` | `fr/24-octobre-2020-le-rapport-...-de-koenigstein.md` |
| 25 | `25-merci-a-nos-lecteurs` | `fr/25-merci-a-nos-lecteurs.md` |

Procédure :

1. Déposer le docx dans `tmp/`.
2. Lancer pandoc (section 2) puis `split.mjs` (section 3, à recréer depuis
   la section 4 si `/tmp/opencode/` a été nettoyé).
3. Pour chaque section, créer le fichier RU en s'aidant du FR correspondant
   pour le frontmatter et les images (sections 5).
4. `npm run build` + vérifications (section 6).
5. Mettre à jour `public/llms.txt` (section 7) et `ROADMAP.md`.
6. Commit (section 8).
