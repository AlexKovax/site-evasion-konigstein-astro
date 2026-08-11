// Métadonnées du site + chaînes i18n + navigation.
export const SITE_TITLE = 'Évasion à Königstein';
export const SITE_DESCRIPTION =
  'Une histoire à découvrir en même temps qu’elle se déroule...';
export const SITE_URL = 'https://evasion-a-konigstein.site';

// Image de couverture du récit (page d'accueil).
export const COVER_IMAGE = '/content/images/2020/04/konig.jpg';

export const AUTHORS = ['Françoise', 'Vladimir'];

export const LOCALES = ['fr', 'ru'] as const;
export const DEFAULT_LOCALE = 'fr';

export const UI = {
  fr: {
    htmlLang: 'fr',
    siteName: SITE_TITLE,
    tagline: SITE_DESCRIPTION,
    navHome: 'Accueil',
    navStory: 'Lire dans l’ordre chronologique',
    authorBy: 'Par',
    publishedOn: 'publié le',
    readingChapter: 'Chapitre',
    intro: 'Introduction',
    tableOfContents: 'Sommaire',
    backToStory: 'Retour au sommaire',
    nextChapter: 'Chapitre suivant',
    previousChapter: 'Chapitre précédent',
    languageName: 'Français',
    switchTo: 'Русская версия',
    translationPending: 'Traduction à venir',
    allChapters: 'Tous les chapitres',
    minRead: 'min de lecture',
  },
  ru: {
    htmlLang: 'ru',
    siteName: 'Побег из Кёнигштайна',
    tagline: 'История, которую вы открываете по мере её развития...',
    navHome: 'Главная',
    navStory: 'Читать в хронологическом порядке',
    authorBy: 'Авторы',
    publishedOn: 'опубликовано',
    readingChapter: 'Глава',
    intro: 'Введение',
    tableOfContents: 'Оглавление',
    backToStory: 'К оглавлению',
    nextChapter: 'Следующая глава',
    previousChapter: 'Предыдущая глава',
    languageName: 'Русский',
    switchTo: 'Version française',
    translationPending: 'Перевод появится позже',
    allChapters: 'Все главы',
    minRead: 'мин чтения',
  },
} as const;

export type Locale = (typeof LOCALES)[number];
