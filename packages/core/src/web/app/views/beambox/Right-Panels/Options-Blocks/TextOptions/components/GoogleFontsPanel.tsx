import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AppstoreOutlined, CloseOutlined, GlobalOutlined, GoogleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Spin, Typography } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import {
  type GoogleFontItem as CachedGoogleFontItem,
  getGoogleFontsCatalogSorted,
} from '@core/helpers/fonts/googleFontsApiCache';

import styles from './GoogleFontsPanel.module.scss';

interface Props {
  onClose: () => void;
  onFontSelect: (fontFamily: string) => void;
  visible: boolean;
}

const CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];

// Icon font detection - these contain symbols/icons, not text
const ICON_FONT_KEYWORDS = ['icons'];

/**
 * Checks if a font is likely an icon/symbol font unsuitable for text
 * @param fontFamily Font family name
 * @returns true if font appears to be an icon font
 */
const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

const GoogleFontsPanel: React.FC<Props> = ({ onClose, onFontSelect, visible }) => {
  const [fonts, setFonts] = useState<CachedGoogleFontItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [selectedFont, setSelectedFont] = useState<CachedGoogleFontItem | null>(null);
  const [showColorFonts] = useState(false); // Hide color fonts by default - always filter them out

  const fetchGoogleFonts = useCallback(async () => {
    setLoading(true);
    try {
      // Use cached Google Fonts API data instead of direct API call
      const data = await getGoogleFontsCatalogSorted();

      // Log problematic fonts for debugging
      const colorFonts =
        data.items?.filter((font) => font.colorCapabilities && font.colorCapabilities.length > 0) || [];
      const iconFonts = data.items?.filter((font) => isIconFont(font.family)) || [];

      if (colorFonts.length > 0) {
        console.log(`Found ${colorFonts.length} color fonts that may not convert to path properly:`);
        colorFonts.forEach((font) => {
          console.log(`  - ${font.family}: ${font.colorCapabilities?.join(', ')}`);
        });
      }

      if (iconFonts.length > 0) {
        console.log(`Found ${iconFonts.length} icon fonts that are not suitable for text:`);
        iconFonts.forEach((font) => {
          console.log(`  - ${font.family}`);
        });
      }

      setFonts(data.items || []);
    } catch (error) {
      console.error('Failed to fetch Google Fonts:', error);
      setFonts([]); // Show empty list on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && fonts.length === 0) {
      fetchGoogleFonts();
    }
  }, [visible, fonts.length, fetchGoogleFonts]);

  const filteredFonts = useMemo(() => {
    let filtered = fonts;

    // Filter out color fonts unless explicitly showing them
    if (!showColorFonts) {
      filtered = filtered.filter((font) => !font.colorCapabilities || font.colorCapabilities.length === 0);
    }

    // Always filter out icon fonts as they're not suitable for text
    filtered = filtered.filter((font) => !isIconFont(font.family));

    if (searchText) {
      filtered = filtered.filter((font) => font.family.toLowerCase().includes(searchText.toLowerCase()));
    }

    if (selectedCategory) {
      filtered = filtered.filter((font) => font.category === selectedCategory);
    }

    if (selectedLanguage) {
      filtered = filtered.filter((font) => font.subsets.includes(selectedLanguage));
    }

    return filtered.slice(0, 100); // Limit to first 100 results for performance
  }, [fonts, searchText, selectedCategory, selectedLanguage, showColorFonts]);

  const loadFont = useCallback(
    (font: CachedGoogleFontItem) => {
      if (loadedFonts.has(font.family)) return;

      // Create font face for preview
      // Note: 'wght' is Google Fonts parameter for font-weight (not a typo)
      const fontUrl = `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@400&display=swap`;
      const link = document.createElement('link');

      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      setLoadedFonts((prev) => new Set(prev).add(font.family));
    },
    [loadedFonts],
  );

  const handleFontClick = useCallback(
    (font: CachedGoogleFontItem) => {
      setSelectedFont(font);
      loadFont(font);
    },
    [loadFont],
  );

  const handleSave = useCallback(async () => {
    if (!selectedFont) return;

    // Warn if selecting a problematic font (this shouldn't happen due to filtering, but just in case)
    if (selectedFont.colorCapabilities && selectedFont.colorCapabilities.length > 0) {
      console.warn(
        `Warning: "${selectedFont.family}" is a color font with capabilities: ${selectedFont.colorCapabilities.join(', ')}. ` +
          `Text-to-path conversion may not work properly for this font.`,
      );
    }

    if (isIconFont(selectedFont.family)) {
      console.warn(
        `Warning: "${selectedFont.family}" appears to be an icon font. ` +
          `This font contains symbols/icons and may not work well for text content.`,
      );
    }

    try {
      // Load the font first
      loadFont(selectedFont);

      // Wait a bit for font to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Pass the font family to the parent component
      // Note: The parent component (TextOptions) will handle adding to fontHistory
      onFontSelect(selectedFont.family);
      onClose();
    } catch (error) {
      console.error('Error selecting font:', error);
    }
  }, [selectedFont, loadFont, onFontSelect, onClose]);

  const categoryOptions = CATEGORIES.map((cat) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
  }));

  const languageOptions = useMemo(() => {
    const allSubsets = new Set<string>();

    fonts.forEach((font) => {
      font.subsets.forEach((subset) => allSubsets.add(subset));
    });

    const languageMapping: Record<string, string> = {
      'chinese-hongkong': 'Chinese (Hong Kong)',
      'chinese-simplified': 'Chinese Simplified',
      'chinese-traditional': 'Chinese Traditional',
    };

    const parseSubsetLabel = (subset: string): string => {
      // First check if we have a custom mapping
      if (languageMapping[subset]) {
        return languageMapping[subset];
      }

      // Handle '-ext' suffix
      if (subset.endsWith('-ext')) {
        const baseName = subset.slice(0, -4); // Remove '-ext'

        return `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Extended`;
      }

      // Replace hyphens with spaces and capitalize each word
      return subset
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return Array.from(allSubsets)
      .sort()
      .map((subset) => ({
        label: parseSubsetLabel(subset),
        value: subset,
      }));
  }, [fonts]);

  return (
    <DraggableModal
      className={styles.modal}
      closable={false}
      footer={null}
      onCancel={onClose}
      open={visible}
      width={1000}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <GoogleOutlined className={styles.googleLogo} />
          <span className={styles.titleText}>GoogleFonts</span>
        </div>
        <Button className={styles.closeButton} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Search */}
          <div className={styles.searchSection}>
            <Input
              className={styles.searchInput}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search Fonts"
              prefix={<SearchOutlined />}
              value={searchText}
            />
          </div>

          {/* Language Filter */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <GlobalOutlined className={styles.filterIcon} />
              <span className={styles.filterLabel}>Language</span>
            </div>
            <Select
              className={styles.languageSelect}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              onChange={setSelectedLanguage}
              options={[{ label: 'All languages', value: '' }, ...languageOptions]}
              placeholder="Language"
              showSearch
              value={selectedLanguage || 'All languages'}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <AppstoreOutlined className={styles.filterIcon} />
              <span className={styles.filterLabel}>Category</span>
            </div>
            <div className={styles.categoryChips}>
              {categoryOptions.map((category) => {
                const isSelected = selectedCategory === category.value;
                const handleCategoryClick = () => {
                  if (isSelected) {
                    // Deselect current category (show all)
                    setSelectedCategory('');
                  } else {
                    // Select this category
                    setSelectedCategory(category.value);
                  }
                };

                return (
                  <button
                    className={`${styles.categoryChip} ${isSelected ? styles.active : ''}`}
                    key={category.value}
                    onClick={handleCategoryClick}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Font Preview Area */}
        <div className={styles.fontPreviewArea}>
          {loading ? (
            <div className={styles.loading}>
              <Spin size="large" />
            </div>
          ) : filteredFonts.length > 0 ? (
            <div className={styles.fontList}>
              {filteredFonts.map((font) => (
                <FontPreview
                  font={font}
                  isSelected={selectedFont?.family === font.family}
                  key={font.family}
                  onClick={() => handleFontClick(font)}
                  onLoad={() => loadFont(font)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Typography.Text type="secondary">
                {fonts.length === 0
                  ? 'Google Fonts are currently unavailable. Please check your internet connection or contact your administrator.'
                  : searchText || selectedCategory
                    ? 'No fonts found matching your search criteria.'
                    : 'No fonts available.'}
              </Typography.Text>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.selectedFontInfo}>
          {selectedFont ? (
            <div className={styles.selectedFontDisplay}>
              <span className={styles.selectedText}>
                Selected: <span className={styles.selectedFontName}>{selectedFont.family}</span>
              </span>
            </div>
          ) : (
            <div className={styles.noSelectionDisplay}>
              <span className={styles.noSelectionText}>No font selected</span>
            </div>
          )}
        </div>
        <div className={styles.footerButtons}>
          <Button onClick={onClose} type="default">
            Cancel
          </Button>
          <Button disabled={!selectedFont} onClick={handleSave} type="primary">
            Save
          </Button>
        </div>
      </div>
    </DraggableModal>
  );
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

export default GoogleFontsPanel;
