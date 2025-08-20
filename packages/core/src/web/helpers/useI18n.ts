import { useMemo } from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import type { ILang } from '@core/interfaces/ILang';

import i18n from './i18n';

const useI18n = (): ILang => {
  const activeLang = useStorageStore((state) => state['active-lang']);

  // eslint-disable-next-line hooks/exhaustive-deps
  const lang = useMemo(() => i18n.lang, [activeLang]);

  return lang;
};

export default useI18n;
