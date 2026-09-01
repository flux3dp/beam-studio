import type { ILang } from '@core/interfaces/ILang';

import LangCa from './ca';
import LangCs from './cs';
import LangDa from './da';
import LangDe from './de';
import LangEl from './el';
import LangEn from './en';
import LangEs from './es';
import LangFi from './fi';
import LangFr from './fr';
import LangId from './id';
import LangIt from './it';
import LangJa from './ja';
import LangKr from './kr';
import LangMs from './ms';
import LangNl from './nl';
import LangNo from './no';
import LangPl from './pl';
import LangPt from './pt';
import LangSe from './se';
import LangTh from './th';
import LangVi from './vi';
import LangZHCN from './zh-cn';
import LangZHTW from './zh-tw';

export const DEFAULT_LANG = 'en';

/** App lang code → language pack. Pure data — safe to import from both web and node. */
export const langs: Record<string, ILang> = {
  ca: LangCa,
  cs: LangCs,
  da: LangDa,
  de: LangDe,
  el: LangEl,
  en: LangEn,
  es: LangEs,
  fi: LangFi,
  fr: LangFr,
  id: LangId,
  it: LangIt,
  ja: LangJa,
  kr: LangKr,
  ms: LangMs,
  nl: LangNl,
  no: LangNo,
  pl: LangPl,
  pt: LangPt,
  se: LangSe,
  th: LangTh,
  vi: LangVi,
  'zh-cn': LangZHCN,
  'zh-tw': LangZHTW,
};

export const getLang = (lang: string): ILang => langs[lang] ?? LangEn;

/**
 * Map a BCP-47 locale (e.g. 'ja-JP', 'ko', 'zh-Hant-TW') to one of our supported lang
 * codes, or DEFAULT_LANG when nothing matches. Callers supply the platform's locale
 * source: navigator.language in the browser, app.getLocale() in the Electron main process.
 */
export const matchSupportedLang = (locale: string): string => {
  const normalized = locale.toLowerCase();

  if (normalized in langs) return normalized;

  // Traditional-script signals (TW/HK region, Hant script) → zh-tw; other Chinese → zh-cn
  if (normalized.startsWith('zh')) return /hant|hk|tw/.test(normalized) ? 'zh-tw' : 'zh-cn';

  // BCP-47 primary subtag → app lang code, for codes that differ (see locale-codes.ts)
  const appCodeByBcp47: Record<string, string> = {
    ko: 'kr', // Korean — our historical key is 'kr' (which BCP-47 assigns to Kanuri)
    nb: 'no', // Norwegian Bokmål — modern OSes report nb/nn, never the generic 'no' we key by
    nn: 'no', // Norwegian Nynorsk — collapses into the same single Norwegian pack
    sv: 'se', // Swedish — our historical key is 'se' (which BCP-47 assigns to Northern Sami)
  };
  const primary = normalized.split('-')[0];
  const appCode = appCodeByBcp47[primary] ?? primary;

  return appCode in langs ? appCode : DEFAULT_LANG;
};

/** App lang code → native display name, for language selectors */
export const supportedLangs = {
  ca: 'Català',
  cs: 'Czech',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  en: 'English',
  es: 'Español',
  fi: 'Suomi',
  fr: 'Français',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  ja: '日本語',
  kr: '한국어',
  ms: 'Melayu',
  nl: 'Nederlands',
  no: 'Norsk',
  pl: 'Polski',
  pt: 'Português',
  se: 'Svenska',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
};
