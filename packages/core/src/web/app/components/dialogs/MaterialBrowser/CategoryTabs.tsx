import React, { useEffect, useMemo } from 'react';

import { HistoryOutlined, SearchOutlined, StarFilled } from '@ant-design/icons';
import { Tabs } from 'antd';

import { MATERIAL_CATEGORIES } from '@core/app/constants/material-catalog/constants';
import useI18n from '@core/helpers/useI18n';
import type { Material } from '@core/interfaces/IMaterial';

import { useMaterialBrowserStore } from './useMaterialBrowserStore';

interface CategoryTabsProps {
  favoritesCount: number;
  resultCount: number;
  searching: boolean;
  visibleMaterials: Material[];
}

/**
 * Tab order (D3/D10): [Result while searching] → Favorites (only if any) → Recents →
 * non-empty categories → Others → empty categories (dimmed) last.
 */
const CategoryTabs = ({
  favoritesCount,
  resultCount,
  searching,
  visibleMaterials,
}: CategoryTabsProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { activeTab, setActiveTab } = useMaterialBrowserStore();

  // The Favorites tab is removed when its last material is unfavorited; fall back to Recents
  useEffect(() => {
    if (activeTab === 'favorites' && favoritesCount === 0) setActiveTab('recents');
  }, [activeTab, favoritesCount, setActiveTab]);

  const items = useMemo(() => {
    const countOf = (category: string) => visibleMaterials.filter((material) => material.category === category).length;
    const categories = MATERIAL_CATEGORIES.filter((category) => category !== 'other');
    const nonEmpty = categories.filter((category) => countOf(category) > 0);
    const empty = categories.filter((category) => countOf(category) === 0);
    const tabs: Array<{ key: string; label: React.ReactNode }> = [];

    if (searching) {
      tabs.push({
        key: 'result',
        label: (
          <span>
            <SearchOutlined /> {`${t.result} (${resultCount})`}
          </span>
        ),
      });
    }

    if (favoritesCount > 0) {
      tabs.push({
        key: 'favorites',
        label: (
          <span>
            <StarFilled style={{ color: '#ffc53d' }} /> {t.favorites}
          </span>
        ),
      });
    }

    tabs.push({
      key: 'recents',
      label: (
        <span>
          <HistoryOutlined /> {t.recents}
        </span>
      ),
    });

    nonEmpty.forEach((category) => {
      tabs.push({ key: category, label: `${t.categories[category]} (${countOf(category)})` });
    });
    tabs.push({
      key: 'other',
      label: countOf('other') ? `${t.categories.other} (${countOf('other')})` : t.categories.other,
    });
    empty.forEach((category) => {
      tabs.push({ key: category, label: <span style={{ opacity: 0.5 }}>{t.categories[category]}</span> });
    });

    return tabs;
  }, [visibleMaterials, favoritesCount, resultCount, searching, t]);

  return (
    <Tabs
      activeKey={searching ? 'result' : activeTab}
      items={items}
      onChange={(key) => {
        if (key !== 'result') setActiveTab(key);
      }}
      size="small"
    />
  );
};

export default CategoryTabs;
