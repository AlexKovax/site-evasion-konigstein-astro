import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeImages } from './src/plugins/rehype-images';

// Site multilingue FR (par défaut) + RU.
// Les slugs historiques Ghost sont conservés pour le SEO ; des redirects
// 301 (public/_redirects + netlify.toml) renvoient les anciennes URLs vers
// les nouvelles routes préfixées /fr/.
export default defineConfig({
  site: 'https://evasion-a-konigstein.site',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'ru'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          ru: 'ru-RU',
        },
      },
      filter: (page) => page !== 'https://evasion-a-konigstein.site/',
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: false,
    },
    rehypePlugins: [rehypeImages],
  },
});
