import React, { useEffect, useState } from 'react';

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
  onLoad: () => void;
}

const FontPreview: React.FC<FontPreviewProps> = ({ font, isSelected, onClick, onLoad }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onLoad();
        }
      },
      { threshold: 0.1 },
    );

    const element = document.querySelector(`[data-font="${font.family}"]`);

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [font.family, onLoad]);

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
            fontFamily: isVisible ? `'${font.family}', sans-serif` : 'inherit',
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
};

export default FontPreview;
