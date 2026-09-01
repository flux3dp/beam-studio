import langEn from '@core/app/lang/en';

// Mirrors the real module, which exposes getActiveLang both as a named export and on the default.
export const getActiveLang = (): string => 'en';

export default {
  getActiveLang,
  lang: langEn,
};
