import { createI18n } from '@core/app/lang/createI18n';
import { getStorage, setStorage, useStorageStore } from '@core/app/stores/storageStore';
import type { ILang } from '@core/interfaces/ILang';

const i18n = createI18n(
  () => getStorage('active-lang'),
  () => navigator.language,
);

export function getActiveLang(): string {
  return i18n.getActiveLang();
}

export function setActiveLang(newVal: string): void {
  i18n.setActiveLang(newVal);
  setStorage('active-lang', newVal);
}

useStorageStore.subscribe(
  (state) => state['active-lang'],
  (newValue) => i18n.setActiveLang(newValue),
);

export default {
  getActiveLang,
  get lang(): ILang {
    return i18n.lang;
  },
  setActiveLang,
};
