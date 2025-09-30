import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppstoreOutlined, CloseOutlined, GlobalOutlined, GoogleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Select, Spin, Typography } from 'antd';
import VirtualList from 'rc-virtual-list';

import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import type { GoogleFontItem as CachedGoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';
import useI18n from '@core/helpers/useI18n';

import FontPreview from './FontPreview';
import styles from './GoogleFontsPanel.module.scss';
import { useGoogleFontData } from './hooks/useGoogleFontData';

interface Props {
  onClose: () => void;
  onFontSelect: (fontFamily: string) => void;
  visible: boolean;
}

const FONTS_PER_PAGE = 40;
const CONTAINER_HEIGHT = 500;
const ITEM_HEIGHT = 145;
const SCROLL_THRESHOLD = 100;

const GoogleFontsPanel: React.FC<Props> = memo(({ onClose, onFontSelect, visible }) => {
  const { categoryOptions, fetchGoogleFonts, fonts, isLoading, languageOptions, loadFont, loadFontForTextEditing } =
    useGoogleFontData();
  const isNetworkAvailable = useGoogleFontStore((state) => state.isNetworkAvailableForGoogleFonts());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<CachedGoogleFontItem | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [displayedFonts, setDisplayedFonts] = useState<CachedGoogleFontItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const virtualListRef = useRef<any>(null);
  const lastScrollTop = useRef<number>(0);
  const hasInitiallyLoaded = useRef<boolean>(false);
  const lang = useI18n();

  // Calculate responsive modal width based on viewport
  const getModalWidth = useCallback(() => {
    const viewportWidth = window.innerWidth;

    if (viewportWidth >= 1100) return 1000;

    if (viewportWidth >= 900) return Math.min(900, viewportWidth - 100);

    if (viewportWidth >= 769) return Math.min(800, viewportWidth - 80);

    if (viewportWidth >= 601) return Math.min(700, viewportWidth - 60);

    return Math.min(600, viewportWidth - 40);
  }, []);

  const [modalWidth, setModalWidth] = useState(getModalWidth());

  const getEmptyStateMessage = useCallback((): string => {
    if (!isNetworkAvailable) {
      return lang.google_font_panel.offline_message;
    }

    if (fonts.length === 0) {
      return lang.google_font_panel.unavailable_message;
    }

    if (searchText || selectedCategory || selectedLanguage) {
      return lang.google_font_panel.no_results_message;
    }

    return lang.google_font_panel.no_fonts_available;
  }, [isNetworkAvailable, fonts.length, searchText, selectedCategory, selectedLanguage, lang]);

  const filterState = useMemo(
    () => ({ category: selectedCategory, language: selectedLanguage, search: searchText }),
    [selectedCategory, selectedLanguage, searchText],
  );
  const prevFilterState = useRef(filterState);

  const handleFontSelectFromSearch = useCallback(
    async (fontFamily: string) => {
      const font = fonts.find(({ family }) => family === fontFamily);

      if (font) {
        setSelectedFont(font);
        loadFont(font);
        setSearchText(fontFamily);
      }
    },
    [fonts, loadFont],
  );

  const allFilteredFonts = useMemo(() => {
    if (!fonts.length) return [];

    return fonts.filter((font) => {
      // Filter out color fonts (emoji/color fonts not suitable for text editing)
      if (font.colorCapabilities && font.colorCapabilities.length > 0) return false;

      // Filter out icon fonts (not suitable for text content)
      if (font.family.toLowerCase().includes('icons')) return false;

      if (selectedCategory && font.category !== selectedCategory) return false;

      if (selectedLanguage && !font.subsets.includes(selectedLanguage)) return false;

      if (searchText && !font.family.toLowerCase().includes(searchText.toLowerCase())) return false;

      return true;
    });
  }, [fonts, selectedCategory, selectedLanguage, searchText]);

  const searchOptions = useMemo(
    () => allFilteredFonts.map(({ family }) => ({ label: family, value: family })),
    [allFilteredFonts],
  );

  const preserveScrollPosition = useCallback(() => {
    if (virtualListRef.current && lastScrollTop.current > 0) {
      requestAnimationFrame(() => {
        virtualListRef.current?.scrollTo({ top: lastScrollTop.current });
      });
    }
  }, []);

  const appendFonts = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const startIndex = (currentPage - 1) * FONTS_PER_PAGE;
    const endIndex = startIndex + FONTS_PER_PAGE;
    const newFonts = allFilteredFonts.slice(startIndex, endIndex);

    newFonts.forEach((font) => loadFont(font));

    setDisplayedFonts((prev) => {
      const updated = [...prev, ...newFonts];

      requestAnimationFrame(() => preserveScrollPosition());

      return updated;
    });

    setCurrentPage((prev) => prev + 1);

    if (endIndex >= allFilteredFonts.length) setHasMore(false);

    setLoadingMore(false);
  }, [allFilteredFonts, currentPage, loadingMore, hasMore, loadFont, preserveScrollPosition]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement, UIEvent>) => {
      const { clientHeight, scrollHeight, scrollTop } = e.currentTarget;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      lastScrollTop.current = scrollTop;

      if (distanceFromBottom <= SCROLL_THRESHOLD && hasMore && !loadingMore) {
        appendFonts();
      }
    },
    [appendFonts, hasMore, loadingMore],
  );

  useEffect(() => {
    if (visible && fonts.length === 0) {
      const timer = setTimeout(() => fetchGoogleFonts(), 50);

      return () => clearTimeout(timer);
    }
  }, [visible, fonts.length, fetchGoogleFonts]);

  // Update modal width on window resize
  useEffect(() => {
    if (!visible) return;

    const handleResize = () => {
      setModalWidth(getModalWidth());
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [visible, getModalWidth]);

  // Handle filter changes
  useEffect(() => {
    const filtersChanged =
      prevFilterState.current.category !== filterState.category ||
      prevFilterState.current.language !== filterState.language ||
      prevFilterState.current.search !== filterState.search;

    if (filtersChanged) {
      prevFilterState.current = filterState;
      hasInitiallyLoaded.current = false;
      setDisplayedFonts([]);
      setCurrentPage(1);
      setHasMore(true);
      setLoadingMore(false);
      lastScrollTop.current = 0;

      if (allFilteredFonts.length > 0) {
        hasInitiallyLoaded.current = true;

        const firstBatch = allFilteredFonts.slice(0, FONTS_PER_PAGE);

        firstBatch.forEach((font) => loadFont(font));
        setDisplayedFonts(firstBatch);
        setCurrentPage(2);
        setHasMore(allFilteredFonts.length > FONTS_PER_PAGE);
      }
    }
  }, [filterState, allFilteredFonts, loadFont]);

  // Handle initial load when fonts become available
  useEffect(() => {
    if (!hasInitiallyLoaded.current && allFilteredFonts.length > 0 && !isLoading) {
      hasInitiallyLoaded.current = true;

      const firstBatch = allFilteredFonts.slice(0, FONTS_PER_PAGE);

      firstBatch.forEach((font) => loadFont(font));
      setDisplayedFonts(firstBatch);
      setCurrentPage(2);
      setHasMore(allFilteredFonts.length > FONTS_PER_PAGE);
    }
  }, [allFilteredFonts, loadFont, isLoading]);

  const handleFontClick = useCallback(
    (font: CachedGoogleFontItem) => {
      setSelectedFont(font);
      loadFont(font);
    },
    [loadFont],
  );

  const handleSelect = useCallback(async () => {
    if (!selectedFont) return;

    try {
      // Load font for text editing (permanent, will upgrade from preview if needed)
      await loadFontForTextEditing(selectedFont.family);
      onFontSelect(selectedFont.family);
      onClose();
    } catch (error) {
      console.error('Error selecting font:', error);
    }
  }, [selectedFont, loadFontForTextEditing, onFontSelect, onClose]);

  return (
    <DraggableModal
      className={styles.modal}
      closable={false}
      footer={null}
      onCancel={onClose}
      open={visible}
      scrollableContent
      width={modalWidth}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <GoogleOutlined className={styles.googleLogo} />
          <span className={styles.titleText}>{lang.google_font_panel.title}</span>
        </div>
        <Button className={styles.closeButton} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <div className={styles.searchSection}>
            <Select
              allowClear
              className={styles.searchInput}
              disabled={!isNetworkAvailable}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              onChange={handleFontSelectFromSearch}
              onClear={() => setSearchText('')}
              onSearch={setSearchText}
              options={searchOptions}
              placeholder={
                isNetworkAvailable
                  ? lang.google_font_panel.search_placeholder
                  : lang.google_font_panel.search_unavailable_offline
              }
              showSearch
              suffixIcon={<SearchOutlined />}
              value={searchText || undefined}
              virtual
            />
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <GlobalOutlined className={styles.filterIcon} />
              <span className={styles.filterLabel}>{lang.google_font_panel.language_label}</span>
            </div>
            <Select
              className={styles.languageSelect}
              disabled={!isNetworkAvailable}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              onChange={setSelectedLanguage}
              options={[{ label: lang.google_font_panel.all_languages, value: '' }, ...languageOptions]}
              placeholder={
                isNetworkAvailable
                  ? lang.google_font_panel.language_placeholder
                  : lang.google_font_panel.language_unavailable_offline
              }
              showSearch
              value={selectedLanguage || lang.google_font_panel.all_languages}
            />
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <AppstoreOutlined className={styles.filterIcon} />
              <span className={styles.filterLabel}>{lang.google_font_panel.category}</span>
            </div>
            <div className={styles.categoryChips}>
              {categoryOptions.map((category) => {
                const isSelected = selectedCategory === category.value;
                const handleCategoryClick = () => {
                  if (isNetworkAvailable) {
                    setSelectedCategory(isSelected ? '' : category.value);
                  }
                };

                return (
                  <button
                    className={`${styles.categoryChip} ${isSelected ? styles.active : ''} ${!isNetworkAvailable ? styles.disabled : ''}`}
                    disabled={!isNetworkAvailable}
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

        <div className={styles.fontPreviewArea}>
          {!isNetworkAvailable ? (
            <div className={styles.offlineState}>
              <Typography.Title className={styles.offlineTitle} level={4}>
                {lang.google_font_panel.no_internet_connection}
              </Typography.Title>
              <Typography.Text className={styles.offlineMessage} type="secondary">
                {getEmptyStateMessage()}
              </Typography.Text>
            </div>
          ) : isLoading ? (
            <div className={styles.loading}>
              <Spin size="large" />
            </div>
          ) : displayedFonts.length > 0 || loadingMore ? (
            <div className={styles.virtualListContainer}>
              <VirtualList
                className={`${styles.fontList} ${styles.virtualList}`}
                data={displayedFonts}
                height={CONTAINER_HEIGHT}
                itemHeight={ITEM_HEIGHT}
                itemKey="family"
                onScroll={onScroll}
                ref={virtualListRef}
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
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Typography.Text type="secondary">{getEmptyStateMessage()}</Typography.Text>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.selectedFontInfo}>
          {selectedFont ? (
            <div className={styles.selectedFontDisplay}>
              <span className={styles.selectedText}>
                {lang.google_font_panel.selected_prefix}{' '}
                <span className={styles.selectedFontName}>{selectedFont.family}</span>
              </span>
            </div>
          ) : (
            <div className={styles.noSelectionDisplay}>
              <span className={styles.noSelectionText}>{lang.google_font_panel.no_selection}</span>
            </div>
          )}
        </div>
        <div className={styles.footerButtons}>
          <Button onClick={onClose} type="default">
            {lang.global.cancel}
          </Button>
          <Button disabled={!selectedFont || !isNetworkAvailable} onClick={handleSelect} type="primary">
            {lang.global.select}
          </Button>
        </div>
      </div>
    </DraggableModal>
  );
});

export default GoogleFontsPanel;
