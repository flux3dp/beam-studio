import React from 'react';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import FluxIcons from '@core/app/icons/flux/FluxIcons';

import fontHelper from './fontHelper';
import styles from './renderTextOptions.module.scss';

export type FontOption = {
  family?: string;
  label: React.ReactNode;
  value: string;
};

export const renderTextOptions = (family: string, isHistory = false): FontOption => {
  const fontName = fontFuncs.fontNameMap.get(family);
  const displayName = fontName ?? family;
  const src = fontHelper.getWebFontPreviewUrl(family);

  const label = src ? (
    <div className={styles.option}>
      <div className={styles['img-container']}>
        <img alt={displayName} draggable="false" src={src} />
      </div>
      {src.includes('monotype') && <FluxIcons.FluxPlus />}
    </div>
  ) : (
    <div className={styles.display} style={{ fontFamily: `'${family}'` }}>
      {displayName}
    </div>
  );

  return isHistory ? { family, label, value: `history-${family}` } : { label, value: family };
};

// Keyed by array identity: font-funcs caches the families array, so a new array means the list changed
const fontFamilyOptionsCache = new WeakMap<string[], FontOption[]>();

export const getFontFamilyOptions = (families: string[]): FontOption[] => {
  let options = fontFamilyOptionsCache.get(families);

  if (!options) {
    options = families.map((family) => renderTextOptions(family));
    fontFamilyOptionsCache.set(families, options);
  }

  return options;
};

export const fontFamilySelectFilterOption: any = (input: string, option?: FontOption) => {
  if (!option) return false;

  if (option?.value) {
    const family = option.value as string;
    const searchKey = input.toLowerCase();

    if (family.toLowerCase().includes(searchKey)) {
      return true;
    }

    const fontName = fontFuncs.fontNameMap.get(family) || '';

    if (fontName.toLowerCase().includes(searchKey)) {
      return true;
    }
  }

  return false;
};
