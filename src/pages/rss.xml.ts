import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPostsByLocale } from '../lib/posts';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export const GET: APIRoute = async (context) => {
  const posts = await getPostsByLocale('fr');
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDatetime,
      link: `/fr/posts/${post.data.slug}/`,
      author: post.data.authors.join(', '),
      categories: post.data.chapter ? [`Chapitre ${post.data.chapter}`] : ['Introduction'],
    })),
    customData: '<language>fr-fr</language>',
  });
};
