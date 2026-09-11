import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty } from 'antd';
import { sprintf } from 'sprintf-js';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { getVisibleVariants } from '@core/helpers/api/material-catalog/selectors';
import useI18n from '@core/helpers/useI18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { Material } from '@core/interfaces/IMaterial';

import styles from './CatalogGrid.module.scss';
import { showMaterialEditorModal } from './editors';
import MaterialCard from './MaterialCard';
import { useMaterialBrowserStore } from './useMaterialBrowserStore';

interface CatalogGridProps {
  machineLabel: string;
  materials: Material[];
  model: PresetModel;
  module: LayerModuleType;
}

const CatalogGrid = ({ machineLabel, materials, model, module }: CatalogGridProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { activeTab, openDetail, query } = useMaterialBrowserStore();
  const materialStore = useMaterialStore();
  const { favorites, toggleFavorite } = materialStore;

  if (materials.length === 0) {
    const description =
      query.trim() !== ''
        ? sprintf(t.no_search_match, query.trim())
        : activeTab === 'recents'
          ? t.recents_empty
          : sprintf(t.no_materials_in_category, machineLabel);

    return (
      <Empty className={styles.empty} description={description}>
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
          variants={getVisibleVariants(material, model, module, materialStore)}
        />
      ))}
    </div>
  );
};

export default CatalogGrid;
