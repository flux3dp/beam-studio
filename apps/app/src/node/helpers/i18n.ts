/**
 * I18n implementation for nodejs usage
 */
import { app } from 'electron';
import ElectronStore from 'electron-store';
import { match } from 'ts-pattern';

import appSettings from '@core/app/app-settings';
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
import type { ILang } from '@core/interfaces/ILang';
import type { StorageManager } from '@core/interfaces/IStorage';

const store = new ElectronStore() as unknown as StorageManager;
const getLang = (lang: string): ILang => {
  return match(lang)
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
let activeLang: string = store.get('active-lang') || appSettings.i18n.default_lang;
let lang: ILang = getLang(activeLang);

export default {
  getNativeLang(): ILang {
    const langKey = store.get('active-lang') || app.getLocale().toLowerCase();

    return getLang(langKey);
  },
  get lang(): ILang {
    return lang;
  },
  reloadActiveLang(): void {
    activeLang = store.get('active-lang') || appSettings.i18n.default_lang;
    lang = getLang(activeLang);
  },
};
