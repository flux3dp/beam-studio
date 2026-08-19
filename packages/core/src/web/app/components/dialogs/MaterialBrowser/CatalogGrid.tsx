import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty } from 'antd';
import { sprintf } from 'sprintf-js';

import { useMaterialStore } from '@core/app/stores/materialStore';
import { getSortedVariants } from '@core/helpers/api/material-catalog/selectors';
import useI18n from '@core/helpers/useI18n';
import type { Material } from '@core/interfaces/IMaterial';

import { showMaterialEditorModal } from './editors';
import styles from './MaterialBrowser.module.scss';
import MaterialCard from './MaterialCard';
import { useMaterialBrowserStore } from './useMaterialBrowserStore';

interface CatalogGridProps {
  machineLabel: string;
  materials: Material[];
}

const CatalogGrid = ({ machineLabel, materials }: CatalogGridProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { activeTab, openDetail, query } = useMaterialBrowserStore();
  const { favorites, toggleFavorite, userVariants } = useMaterialStore();

  if (materials.length === 0) {
    const description =
      query.trim() !== ''
        ? sprintf(t.no_search_match, query.trim())
        : activeTab === 'recents'
          ? t.recents_empty
          : sprintf(t.no_materials_in_category, machineLabel);

    return (
      <Empty description={description} style={{ padding: '40px 0' }}>
        {activeTab !== 'recents' && query.trim() === '' && (
          <Button icon={<PlusOutlined />} onClick={() => showMaterialEditorModal()} type="primary">
            {t.add_material}
          </Button>
        )}
      </Empty>
    );
  }

  return (
    <div className={styles.gallery}>
      {materials.map((material) => (
        <MaterialCard
          isFavorite={favorites.includes(material.id)}
          key={material.id}
          material={material}
          onOpen={openDetail}
          onToggleFavorite={toggleFavorite}
          variants={getSortedVariants(material, userVariants)}
        />
      ))}
    </div>
  );
};

export default CatalogGrid;
