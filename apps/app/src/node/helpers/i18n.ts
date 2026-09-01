/**
 * I18n implementation for nodejs usage
 */
import { app } from 'electron';
import ElectronStore from 'electron-store';

import { createI18n } from '@core/app/lang/createI18n';
import type { ILang } from '@core/interfaces/ILang';
import type { StorageManager } from '@core/interfaces/IStorage';

const store = new ElectronStore() as unknown as StorageManager;
const i18n = createI18n(
  () => store.get('active-lang'),
  () => app.getLocale(),
);

export default {
  getNativeLang: i18n.getNativeLang,
  get lang(): ILang {
    return i18n.lang;
  },
  reloadActiveLang: i18n.reload,
};
