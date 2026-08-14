import type { APIRoute } from 'astro';
import { getPostsByLocale } from '../lib/posts';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, AUTHORS } from '../consts';

export const GET: APIRoute = async () => {
  const posts = await getPostsByLocale('fr');
  const parts: string[] = [];

  parts.push(
    `# ${SITE_TITLE}\n`,
    `\n> ${SITE_DESCRIPTION}\n`,
    `\nAuteurs : ${AUTHORS.join(' & ')}`,
    `\nURL : ${SITE_URL}`,
    `\nLangue : français`,
    `\n## Récit complet (introduction + 25 chapitres)\n`,
  );

  for (const post of posts) {
    const { title, chapter, pubDatetime, description, authors, slug } = post.data;
    const url = `${SITE_URL}/fr/posts/${slug}/`;
    const dateStr = pubDatetime.toISOString().split('T')[0];
    parts.push(`\n---\n\n## ${chapter ? `${chapter}. ` : ''}${title}\n`);
    parts.push(`\nURL : ${url}`);
    parts.push(`\nDate de publication : ${dateStr}`);
    parts.push(`\nAuteurs : ${authors.join(' & ')}`);
    if (description) {
      parts.push(`\n\n> ${description.replace(/\\n/g, ' ').slice(0, 300)}`);
    }
    if (post.body) {
      parts.push(`\n\n${post.body}`);
    }
  }

  return new Response(parts.join(''), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
