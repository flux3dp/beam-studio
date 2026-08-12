import React from 'react';

import { StarFilled, StarOutlined } from '@ant-design/icons';
import { Space, Tag } from 'antd';
import { sprintf } from 'sprintf-js';

import { getMaterialDisplayName } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialRegion } from '@core/interfaces/IMaterial';

import styles from './MaterialBrowser.module.scss';
import { getCoverStyle } from './utils/coverStyle';
import { inchDisplay } from './utils/inchDisplay';

interface MaterialCardProps {
  isFavorite: boolean;
  material: Material;
  onOpen: (materialId: string) => void;
  onToggleFavorite: (materialId: string) => void;
  region: MaterialRegion;
  variantCount: number;
}

const MaterialCard = ({
  isFavorite,
  material,
  onOpen,
  onToggleFavorite,
  region,
  variantCount,
}: MaterialCardProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  // D18: thickness badge hidden for 0/unset thickness
  const thickness =
    region === 'us'
      ? material.thicknessInch
        ? inchDisplay(material.thicknessInch)
        : null
      : material.thicknessMm
        ? `${material.thicknessMm} mm`
        : null;
  const badge =
    variantCount > 1
      ? thickness
        ? `${thickness} · ${sprintf(t.variants, variantCount)}`
        : sprintf(t.variants, variantCount)
      : thickness;

  return (
    <div className={styles.card} data-testid={`material-card-${material.id}`} onClick={() => onOpen(material.id)}>
      <div className={styles.cover} style={getCoverStyle(material)}>
        <span
          className={styles.fav}
          data-testid="favorite-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(material.id);
          }}
        >
          {isFavorite ? <StarFilled style={{ color: '#ffc53d' }} /> : <StarOutlined />}
        </span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{getMaterialDisplayName(material)}</div>
        {material.tags && material.tags.length > 0 && (
          <Space size={[4, 4]} wrap>
            {material.tags.map((tag) => (
              <Tag bordered={false} key={tag} style={{ fontSize: 11, margin: 0 }}>
                {tag}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

export default MaterialCard;
