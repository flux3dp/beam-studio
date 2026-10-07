import { supportedLangs } from '@core/app/lang';

/** UI languages whose users write Chinese seals: the KAI-font templates are offered here. */
export const CHINESE_LOCALES = ['zh-cn', 'zh-tw'];

/** Every other UI language, for the Latin-script twin of a Chinese template. */
export const OTHER_LOCALES = Object.keys(supportedLangs).filter((lang) => !CHINESE_LOCALES.includes(lang));
