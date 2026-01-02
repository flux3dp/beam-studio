import { match } from 'ts-pattern';

import AppSettings from '@core/app/app-settings';
import LangCa from '@core/app/lang/ca';
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
import { getStorage, setStorage, useStorageStore } from '@core/app/stores/storageStore';
import type { ILang } from '@core/interfaces/ILang';

const getLang = (lang: string): ILang => {
  return match(lang)
    .with('ca', () => LangCa)
    .with('cs', () => LangCs)
    .with('da', () => LangDa)
    .with('de', () => LangDe)
    .with('el', () => LangEl)
    .with('en', () => LangEn)
    .with('es', () => LangEs)
    .with('fi', () => LangFi)
    .with('fr', () => LangFr)
    .with('id', () => LangId)
    .with('it', () => LangIt)
    .with('ja', () => LangJa)
    .with('kr', () => LangKr)
    .with('ms', () => LangMs)
    .with('nl', () => LangNl)
    .with('no', () => LangNo)
    .with('pl', () => LangPl)
    .with('pt', () => LangPt)
    .with('se', () => LangSe)
    .with('th', () => LangTh)
    .with('vi', () => LangVi)
    .with('zh-cn', () => LangZHCN)
    .with('zh-tw', () => LangZHTW)
    .otherwise(() => LangEn);
};

let activeLang = getStorage('active-lang') || AppSettings.i18n.default_lang;
let lang = getLang(activeLang);

export function getActiveLang(): string {
  return activeLang;
}

export function setActiveLang(newVal: string): void {
  activeLang = newVal;
  lang = getLang(activeLang);
  setStorage('active-lang', newVal);
}

useStorageStore.subscribe(
  (state) => state['active-lang'],
  (newValue) => {
    activeLang = newValue;
    lang = getLang(activeLang);
  },
);

export default {
  getActiveLang,
  get lang(): ILang {
    return lang;
  },
  setActiveLang,
};
