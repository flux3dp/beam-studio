import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, Spin, Typography } from 'antd';

import styles from './GoogleFontsPanel.module.scss';

interface GoogleFontItem {
  category: string;
  family: string;
  files: Record<string, string>;
  subsets: string[];
  variants: string[];
}

interface GoogleFontsApiResponse {
  items: GoogleFontItem[];
}

interface Props {
  onClose: () => void;
  onFontSelect: (fontFamily: string) => void;
  visible: boolean;
}

// TODO: Move this to environment configuration or user settings
const GOOGLE_FONTS_API_KEY = 'YOUR_GOOGLE_API_KEY';
const CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];

const GoogleFontsPanel: React.FC<Props> = ({ onClose, onFontSelect, visible }) => {
  const [fonts, setFonts] = useState<GoogleFontItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [selectedFont, setSelectedFont] = useState<GoogleFontItem | null>(null);

  const fetchGoogleFonts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`,
      );

      if (!response.ok) {
        if (response.status === 400) {
          console.warn('Google Fonts API key is invalid or expired. Please configure a valid API key.');
          setFonts([]); // Show empty list

          return;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as GoogleFontsApiResponse;

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
  }, [fonts, searchText, selectedCategory, selectedLanguage]);

  const loadFont = useCallback(
    (font: GoogleFontItem) => {
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
    (font: GoogleFontItem) => {
      setSelectedFont(font);
      loadFont(font);
    },
    [loadFont],
  );

  const handleSave = useCallback(async () => {
    if (!selectedFont) return;

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
    <Modal className={styles.modal} closable={false} footer={null} onCancel={onClose} open={visible} width={800}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Typography.Text className={styles.logo}>G</Typography.Text>
          <Typography.Title className={styles.titleText} level={4}>
            GoogleFonts
          </Typography.Title>
        </div>
        <Button className={styles.closeButton} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      <div className={styles.filters}>
        <Input
          className={styles.searchInput}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search Fonts"
          prefix={<SearchOutlined />}
          value={searchText}
        />
        <div className={styles.categoryFilter}>
          <Typography.Text className={styles.filterLabel}>Category</Typography.Text>
          <Select
            className={styles.categorySelect}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            onChange={setSelectedCategory}
            options={[{ label: 'All', value: '' }, ...categoryOptions]}
            placeholder="Category"
            showSearch
            value={selectedCategory || undefined}
          />
        </div>
        <div className={styles.languageFilter}>
          <Typography.Text className={styles.filterLabel}>Language</Typography.Text>
          <Select
            className={styles.languageSelect}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            onChange={setSelectedLanguage}
            options={[{ label: 'All', value: '' }, ...languageOptions]}
            placeholder="Language"
            placement="bottomRight"
            popupMatchSelectWidth={false}
            showSearch
            value={selectedLanguage || undefined}
          />
        </div>
      </div>

      <div className={styles.content}>
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

      <div className={styles.footer}>
        <Button onClick={onClose} type="default">
          Cancel
        </Button>
        <Button disabled={!selectedFont} onClick={handleSave} type="primary">
          Save
        </Button>
      </div>
    </Modal>
  );
};

interface FontPreviewProps {
  font: GoogleFontItem;
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

  return (
    <div
      className={`${styles.fontPreview} ${isSelected ? styles.selected : ''}`}
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
      <div className={styles.fontInfo}>
        <div className={styles.fontHeader}>
          <Typography.Text className={styles.fontName}>{font.family}</Typography.Text>
          <Typography.Text className={styles.fontMeta}>
            {font.variants?.length || 0} styles | {font.category}
          </Typography.Text>
          <div className={styles.fontSubsets}>
            {font.subsets.slice(0, 3).map((subset) => (
              <span className={styles.subsetTag} key={subset}>
                {subset}
              </span>
            ))}
            {font.subsets.length > 3 && <span className={styles.subsetMore}>+{font.subsets.length - 3} more</span>}
          </div>
        </div>
      </div>

      <div className={styles.fontSample}>
        <div
          className={styles.sampleText}
          style={{
            fontFamily: isVisible ? `'${font.family}', sans-serif` : 'inherit',
          }}
        >
          {previewText}
        </div>
      </div>
    </div>
  );
};

// Sample text based on font type/category
const getSampleText = (fontFamily: string): string => {
  const family = fontFamily.toLowerCase();

  if (family.includes('serif')) {
    return 'Everyone has the right to freedom of thought,';
  }

  if (family.includes('code') || family.includes('mono')) {
    return 'public static int fib(int n) { a =';
  }

  if (family.includes('display') || family.includes('gothic')) {
    return 'Everyone has the right to freedom of though';
  }

  // Default text similar to the image
  return 'Everyone has the right to freedom of thought,';
};

export default GoogleFontsPanel;
