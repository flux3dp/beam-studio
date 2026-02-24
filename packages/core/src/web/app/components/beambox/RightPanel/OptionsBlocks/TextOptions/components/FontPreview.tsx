import React from 'react';

import classNames from 'classnames';

import type { GoogleFontItem as CachedGoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';

import styles from './GoogleFontsPanel.module.scss';

const getSampleText = (fontFamily: string): string => {
  const family = fontFamily.toLowerCase();

  if (family.includes('code') || family.includes('mono')) {
    return 'public static int fib(int n) { a = 0; b = 1; result = 0; for (int i = 2; i <=n; i++) { result = a + b; a = b b = result } return result; }';
  }

  return 'Everyone has the right to freedom of thought, conscience and religion; this right includes freedom';
};

interface FontPreviewProps {
  font: CachedGoogleFontItem;
  isSelected: boolean;
  onClick: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

const FontPreview = ({ font, isSelected, onClick, ref }: FontPreviewProps) => {
  const previewText = getSampleText(font.family);

  return (
    <div
      className={classNames(styles.fontCard, { [styles.selected]: isSelected })}
      data-font={font.family}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      ref={ref}
      role="button"
      tabIndex={0}
    >
      <div className={styles.fontHeader}>
        <div className={styles.fontTitle}>
          <span className={styles.fontName}>{font.family}</span>
          <span className={styles.fontMeta}>
            {font.variants?.length || 0} style{(font.variants?.length || 0) !== 1 ? 's' : ''} | {font.category || ''}
          </span>
        </div>
      </div>

      <div className={styles.fontSample}>
        <div
          className={styles.sampleText}
          style={{ '--preview-font-family': `'${font.family}', sans-serif` } as React.CSSProperties}
        >
          {previewText}
        </div>
      </div>
    </div>
  );
};

export default FontPreview;
