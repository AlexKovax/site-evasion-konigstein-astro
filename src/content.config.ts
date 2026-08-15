import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Collection unique "posts" pour FR et RU.
// Les fichiers vivent dans src/content/posts/<lang>/<slug>.md
// L'id renvoyé par le glob loader est "<lang>/<slug>".
const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/posts',
    // Les slugs FR et RU étant identiques (seul le contenu change), on ne peut
    // pas utiliser `data.slug` comme id (collision). On génère un id unique
    // par langue à partir du chemin relatif: "<lang>/<slug>".
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    chapter: z.number().int().positive().optional(),
    pubDatetime: z.coerce.date(),
    modDatetime: z.coerce.date().optional(),
    description: z.string().default(''),
    authors: z.array(z.string()).default(['Françoise', 'Vladimir']),
    lang: z.enum(['fr', 'ru']).default('fr'),
    // image de couverture optionnelle (chemin public)
    cover: z.string().optional(),
  }),
});

export const collections = { posts };
