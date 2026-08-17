// Helpers pour récupérer et ordonner les articles par langue.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../consts';

export type Post = CollectionEntry<'posts'>;

export async function getPostsByLocale(locale: Locale): Promise<Post[]> {
  const all = await getCollection('posts', (e) => e.data.lang === locale);
  return all.sort((a, b) => {
    // ordre du récit :
    //   1. introduction (chapter null, appendix false) en premier
    //   2. chapitres numérotés (par numéro, puis par date)
    //   3. annexes (appendix true) en dernier, par date
    const rankA = a.data.appendix ? 2 : a.data.chapter == null ? 0 : 1;
    const rankB = b.data.appendix ? 2 : b.data.chapter == null ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    if (rankA === 1) {
      const ca = a.data.chapter ?? 0;
      const cb = b.data.chapter ?? 0;
      if (ca !== cb) return ca - cb;
    }
    return a.data.pubDatetime.getTime() - b.data.pubDatetime.getTime();
  });
}

// slug nu (sans le préfixe de langue)
export function postSlug(post: Post): string {
  return post.data.slug || post.id.split('/').slice(1).join('/');
}

// URL canonique d'un article pour une locale
export function postUrl(post: Post, locale: Locale): string {
  const slug = postSlug(post);
  return `/${locale}/posts/${slug}/`;
}

// titre localisé d'un chapitre
export function chapterLabel(post: Post, locale: Locale): string | null {
  if (post.data.chapter == null) return null;
  return `${post.data.chapter}.`;
}
