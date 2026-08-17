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

// Court texte de présentation du site (encadré d'accueil + page À propos).
export const SITE_INTRO = {
  fr: `Ce site rassemble le récit historique d'une évasion familiale : celle de Léon Dormoy, grand-père de Françoise, évadé de la forteresse de Königstein en 1915. Du village de Dannevoux aux routes de Russie, de Moscou à Tachkent et Samarcande, vingt-cinq chapitres retracent cette histoire vraie, écrite par Françoise et Vladimir.`,
  ru: `Этот сайт объединяет историческое повествование о семейном побеге: о Леоне Дормуа, дедушке Франсуазы, бежавшем из крепости Кёнигштайн в 1915 году. От деревни Даннво до дорог России, от Москвы до Ташкента и Самарканда, двадцать пять глав прослеживают эту правдивую историю, написанную Франсуазой и Владимиром.`,
};

export const UI = {
  fr: {
    htmlLang: 'fr',
    siteName: SITE_TITLE,
    tagline: SITE_DESCRIPTION,
    navHome: 'Sommaire',
    navAbout: 'À propos',
    aboutPending: 'À compléter.',
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
    navHome: 'Оглавление',
    navAbout: 'О сайте',
    aboutPending: 'Будет дополнено.',
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
