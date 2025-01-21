import AppSettings from '@core/app/app-settings';
import LangCs from '@core/app/lang/cs';
import LangDa from '@core/app/lang/da';
import LangDe from '@core/app/lang/de';
import LangEl from '@core/app/lang/el';
import LangEn from '@core/app/lang/en';
import LangEs from '@core/app/lang/es';
import LangFi from '@core/app/lang/fi';
import LangFr from '@core/app/lang/fr';
import LangId from '@core/app/lang/id';
import LangIt from '@core/app/lang/it';
import LangJa from '@core/app/lang/ja';
import LangKr from '@core/app/lang/kr';
import LangMs from '@core/app/lang/ms';
import LangNl from '@core/app/lang/nl';
import LangNo from '@core/app/lang/no';
import LangPl from '@core/app/lang/pl';
import LangPt from '@core/app/lang/pt';
import LangSe from '@core/app/lang/se';
import LangTh from '@core/app/lang/th';
import LangVi from '@core/app/lang/vi';
import LangZHCN from '@core/app/lang/zh-cn';
import LangZHTW from '@core/app/lang/zh-tw';
import storage from '@app/implementations/storage';
import { ILang } from '@core/interfaces/ILang';

const ACTIVE_LANG = 'active-lang';
const langCache: { [key: string]: ILang } = {
  cs: LangCs,
  de: LangDe,
  en: LangEn,
  es: LangEs,
  pt: LangPt,
  fr: LangFr,
  nl: LangNl,
  'zh-tw': LangZHTW,
  ja: LangJa,
  kr: LangKr,
  'zh-cn': LangZHCN,
  pl: LangPl,
  da: LangDa,
  el: LangEl,
  fi: LangFi,
  id: LangId,
  it: LangIt,
  ms: LangMs,
  no: LangNo,
  se: LangSe,
  th: LangTh,
  vi: LangVi,
};

let activeLang = (storage.get(ACTIVE_LANG) as string) || AppSettings.i18n.default_lang;

/**
 * set active language
 *
 * @param {string} language code in lower case
 *
 * @return string
 */
export function getActiveLang(): string {
  return (storage.get(ACTIVE_LANG) as string) || AppSettings.i18n.default_lang;
}

/**
 * set active language
 *
 * @param {string} language code in lower case
 */
export function setActiveLang(lang: string): void {
  activeLang = lang;
  storage.set(ACTIVE_LANG, lang);
}

export default {
  getActiveLang,
  setActiveLang,
  get lang(): ILang {
    return langCache[activeLang] || langCache[AppSettings.i18n.default_lang];
  },
};
