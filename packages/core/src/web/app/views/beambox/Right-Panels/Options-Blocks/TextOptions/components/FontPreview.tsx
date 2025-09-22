import { forwardRef } from 'react';

import type { GoogleFontItem as CachedGoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';

import styles from './GoogleFontsPanel.module.scss';

// Sample text based on font type/category - matching Google Fonts samples
const getSampleText = (fontFamily: string): string => {
  const family = fontFamily.toLowerCase();

  if (family.includes('code') || family.includes('mono')) {
    return 'public static int fib(int n) { a =';
  }

  return 'Everyone has the right to freedom of thought,';
};

interface FontPreviewProps {
  font: CachedGoogleFontItem;
  isSelected: boolean;
  onClick: () => void;
}

const FontPreview = forwardRef<HTMLDivElement, FontPreviewProps>(({ font, isSelected, onClick }, ref) => {
  const previewText = getSampleText(font.family);

  const getCategory = (font: CachedGoogleFontItem): string => {
    return font.category || '';
  };

  return (
    <div
      className={`${styles.fontCard} ${isSelected ? styles.selected : ''}`}
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
      {/* Font Header */}
      <div className={styles.fontHeader}>
        <div className={styles.fontTitle}>
          <span className={styles.fontName}>{font.family}</span>
          <span className={styles.fontMeta}>
            {font.variants?.length || 0} style{(font.variants?.length || 0) !== 1 ? 's' : ''} | {getCategory(font)}
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
});

export default FontPreview;
