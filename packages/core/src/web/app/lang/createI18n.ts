import type { ILang } from '@core/interfaces/ILang';

import { getLang, matchSupportedLang } from '.';

/**
 * Shared i18n state machinery for both runtimes; only the storage read and the platform's
 * locale source are injected (web: storageStore + navigator.language, Electron main:
 * electron-store + app.getLocale()). Persisting a language change stays with the caller —
 * setActiveLang only updates the in-memory state.
 *
 * Resolution is lazy (first read, not module init): Electron's app.getLocale() is only
 * valid after the 'ready' event, and the main-process helper is imported before that.
 */
export const createI18n = (readStoredLang: () => string | undefined, readNativeLocale: () => string) => {
  const resolve = () => readStoredLang() || matchSupportedLang(readNativeLocale());
  const init = () => {
    const activeLang = resolve();

    return { activeLang, lang: getLang(activeLang) };
  };

  let state: null | ReturnType<typeof init> = null;

  return {
    getActiveLang: (): string => (state ??= init()).activeLang,
    getNativeLang: (): ILang => getLang(resolve()),
    get lang(): ILang {
      return (state ??= init()).lang;
    },
    reload: (): void => {
      state = init();
    },
    setActiveLang: (newVal: string): void => {
      state = { activeLang: newVal, lang: getLang(newVal) };
    },
  };
};
