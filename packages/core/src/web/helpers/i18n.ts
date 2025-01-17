import AppSettings from 'app/app-settings';
import LangCs from 'app/lang/cs';
import LangDa from 'app/lang/da';
import LangDe from 'app/lang/de';
import LangEl from 'app/lang/el';
import LangEn from 'app/lang/en';
import LangEs from 'app/lang/es';
import LangFi from 'app/lang/fi';
import LangFr from 'app/lang/fr';
import LangId from 'app/lang/id';
import LangIt from 'app/lang/it';
import LangJa from 'app/lang/ja';
import LangKr from 'app/lang/kr';
import LangMs from 'app/lang/ms';
import LangNl from 'app/lang/nl';
import LangNo from 'app/lang/no';
import LangPl from 'app/lang/pl';
import LangPt from 'app/lang/pt';
import LangSe from 'app/lang/se';
import LangTh from 'app/lang/th';
import LangVi from 'app/lang/vi';
import LangZHCN from 'app/lang/zh-cn';
import LangZHTW from 'app/lang/zh-tw';
import storage from 'implementations/storage';
import { ILang } from 'interfaces/ILang';

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

let activeLang = storage.get(ACTIVE_LANG) as string || AppSettings.i18n.default_lang;

/**
 * set active language
 *
 * @param {string} language code in lower case
 *
 * @return string
 */
export function getActiveLang(): string {
  return storage.get(ACTIVE_LANG) as string || AppSettings.i18n.default_lang;
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
