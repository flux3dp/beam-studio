import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AppstoreOutlined, CloseOutlined, GlobalOutlined, GoogleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Select, Spin, Typography } from 'antd';
import VirtualList from 'rc-virtual-list';

import DraggableModal from '@core/app/widgets/DraggableModal';
import type { GoogleFontItem as CachedGoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';

import FontPreview from './FontPreview';
import styles from './GoogleFontsPanel.module.scss';
import { useGoogleFontData } from './hooks/useGoogleFontData';

interface Props {
  onClose: () => void;
  onFontSelect: (fontFamily: string) => void;
  visible: boolean;
}

const GoogleFontsPanel: React.FC<Props> = memo(({ onClose, onFontSelect, visible }) => {
  const { categoryOptions, fetchGoogleFonts, fonts, languageOptions, loadFont, loading } = useGoogleFontData();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<CachedGoogleFontItem | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  // Infinite scroll state
  const [displayedFonts, setDisplayedFonts] = useState<CachedGoogleFontItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const FONTS_PER_PAGE = 40;
  const CONTAINER_HEIGHT = 600;

  // Handle font selection from search
  const handleFontSelectFromSearch = useCallback(
    (fontFamily: string) => {
      const font = fonts.find((f) => f.family === fontFamily);

      if (font) {
        setSelectedFont(font);
        loadFont(font);
        setSearchText(fontFamily); // Set the selected font name in search text
      }
    },
    [fonts, loadFont],
  );

  // Get all filtered fonts (for search options and pagination source)
  const allFilteredFonts = useMemo(() => {
    if (!fonts.length) return [];

    return fonts.filter((font) => {
      // Filter out color fonts and icon fonts
      if (font.colorCapabilities && font.colorCapabilities.length > 0) return false;

      if (font.family.toLowerCase().includes('icons')) return false;

      // Apply category filter if active
      if (selectedCategory && font.category !== selectedCategory) return false;

      // Apply language filter if active
      if (selectedLanguage && !font.subsets.includes(selectedLanguage)) return false;

      // Apply search text filter if active
      if (searchText && !font.family.toLowerCase().includes(searchText.toLowerCase())) return false;

      return true;
    });
  }, [fonts, selectedCategory, selectedLanguage, searchText]);

  // Create search options from filtered fonts
  const searchOptions = useMemo(() => {
    return allFilteredFonts.map((font) => ({
      label: font.family,
      value: font.family,
    }));
  }, [allFilteredFonts]);

  // Load more fonts for infinite scroll
  const appendFonts = useCallback(
    (_showMessage = false) => {
      if (loadingMore || !hasMore) return;

      setLoadingMore(true);

      // Calculate start and end indices for current page
      const startIndex = (currentPage - 1) * FONTS_PER_PAGE;
      const endIndex = startIndex + FONTS_PER_PAGE;
      const newFonts = allFilteredFonts.slice(startIndex, endIndex);

      // Load CSS for new fonts immediately
      newFonts.forEach((font) => {
        loadFont(font);
      });

      // Update displayed fonts
      setDisplayedFonts((prev) => [...prev, ...newFonts]);
      setCurrentPage((prev) => prev + 1);

      // Check if we have more fonts to load
      if (endIndex >= allFilteredFonts.length) {
        setHasMore(false);
      }

      setLoadingMore(false);
    },
    [allFilteredFonts, currentPage, loadingMore, hasMore, FONTS_PER_PAGE, loadFont],
  );

  // Scroll handler for infinite loading
  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement, UIEvent>) => {
      const { clientHeight, scrollHeight, scrollTop } = e.currentTarget;

      // Check if scrolled to bottom (with 1px tolerance)
      if (Math.abs(scrollHeight - scrollTop - clientHeight) <= 1 && hasMore && !loadingMore) {
        appendFonts(true);
      }
    },
    [appendFonts, hasMore, loadingMore],
  );

  // Fetch fonts when panel becomes visible with delay for better perceived performance
  useEffect(() => {
    if (visible && fonts.length === 0) {
      // Small delay to let the modal render first
      const timer = setTimeout(() => {
        fetchGoogleFonts();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [visible, fonts.length, fetchGoogleFonts]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedFonts([]);
    setCurrentPage(1);
    setHasMore(true);
    setLoadingMore(false);

    // Load first batch when filters change and we have fonts
    if (allFilteredFonts.length > 0) {
      const firstBatch = allFilteredFonts.slice(0, FONTS_PER_PAGE);

      // Load CSS for first batch of fonts immediately
      firstBatch.forEach((font) => {
        loadFont(font);
      });

      setDisplayedFonts(firstBatch);
      setCurrentPage(2);
      setHasMore(allFilteredFonts.length > FONTS_PER_PAGE);
    }
  }, [allFilteredFonts, FONTS_PER_PAGE, loadFont]);

  // Handle font selection
  const handleFontClick = useCallback(
    (font: CachedGoogleFontItem) => {
      setSelectedFont(font);
      loadFont(font);
    },
    [loadFont],
  );

  // Handle font save
  const handleSave = useCallback(async () => {
    if (!selectedFont) return;

    try {
      // Load the font first
      loadFont(selectedFont);

      // Pass the font family to the parent component
      onFontSelect(selectedFont.family);
      onClose();
    } catch (error) {
      console.error('Error selecting font:', error);
    }
  }, [selectedFont, loadFont, onFontSelect, onClose]);

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
          {/* Enhanced Search */}
          <div className={styles.searchSection}>
            <Select
              allowClear
              className={styles.searchInput}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              onChange={handleFontSelectFromSearch}
              onClear={() => setSearchText('')}
              onSearch={setSearchText}
              options={searchOptions}
              placeholder="Search fonts..."
              showSearch
              style={{ width: '100%' }}
              suffixIcon={<SearchOutlined />}
              value={searchText || undefined}
              virtual
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
                  setSelectedCategory(isSelected ? '' : category.value);
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
          ) : displayedFonts.length > 0 || loadingMore ? (
            <div style={{ position: 'relative' }}>
              <VirtualList
                className={styles.fontList}
                data={displayedFonts}
                height={CONTAINER_HEIGHT}
                itemHeight={145}
                itemKey="family"
                onScroll={onScroll}
                styles={{
                  verticalScrollBar: {
                    width: '8px',
                  },
                  verticalScrollBarThumb: {
                    background: 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                {(font) => (
                  <FontPreview
                    font={font}
                    isSelected={selectedFont?.family === font.family}
                    key={font.family}
                    onClick={() => handleFontClick(font)}
                  />
                )}
              </VirtualList>
              {loadingMore && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '4px',
                    bottom: '10px',
                    left: '50%',
                    padding: '16px',
                    position: 'absolute',
                    textAlign: 'center',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Spin size="small" />
                  <span style={{ marginLeft: '8px' }}>Loading more fonts...</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Typography.Text type="secondary">
                {fonts.length === 0
                  ? 'Google Fonts are currently unavailable. Please check your internet connection or contact your administrator.'
                  : searchText || selectedCategory || selectedLanguage
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
});

export default GoogleFontsPanel;
