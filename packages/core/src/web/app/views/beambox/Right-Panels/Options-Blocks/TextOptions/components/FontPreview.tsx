import { forwardRef } from 'react';

import type { GoogleFontItem as CachedGoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';

import styles from './GoogleFontsPanel.module.scss';

// Sample text based on font type/category - matching Google Fonts samples
const getSampleText = (fontFamily: string): string => {
  const family = fontFamily.toLowerCase();

  if (family.includes('code') || family.includes('mono')) {
    return 'public static int fib(int n) { a =';
  }

  if (family.includes('serif')) {
    return 'Everyone has the right to freedom of thought,';
  }

  if (family.includes('display') || family.includes('gothic')) {
    return 'Everyone has the right to freedom of though';
  }

  // Default text matching Google Fonts preview
  return 'Everyone has the right to freedom of thought,';
};

interface FontPreviewProps {
  font: CachedGoogleFontItem;
  isSelected: boolean;
  onClick: () => void;
}

const FontPreview = forwardRef<HTMLDivElement, FontPreviewProps>(({ font, isSelected, onClick }, ref) => {
  const previewText = getSampleText(font.family);

  // Get foundry/designer information
  const getFoundryInfo = (font: CachedGoogleFontItem): string => {
    // Extract designer info from font.files or other metadata if available
    // For now, showing category as placeholder
    return font.category || 'Google';
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
            {font.variants?.length || 0} style{(font.variants?.length || 0) !== 1 ? 's' : ''} | {getFoundryInfo(font)}
          </span>
        </div>
      </div>

      {/* Font Sample */}
      <div className={styles.fontSample}>
        <div
          className={styles.sampleText}
          style={{
            fontFamily: `'${font.family}', sans-serif`,
            fontSize: '32px',
            fontWeight: 400,
            lineHeight: '1.2',
          }}
        >
          {previewText}
        </div>
      </div>
    </div>
  );
});

export default FontPreview;
