import React from 'react';

import { StarFilled, StarOutlined } from '@ant-design/icons';
import { Space, Tag } from 'antd';
import { sprintf } from 'sprintf-js';

import { getMaterialDisplayName } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialVariant } from '@core/interfaces/IMaterial';

import styles from './MaterialBrowser.module.scss';
import { getCoverStyle } from './utils/coverStyle';
import { getThicknessLabel } from './utils/inchDisplay';

interface MaterialCardProps {
  isFavorite: boolean;
  material: Material;
  onOpen: (materialId: string) => void;
  onToggleFavorite: (materialId: string) => void;
  /** Effective variants (catalog ∪ user-added) */
  variants: MaterialVariant[];
}

const MaterialCard = ({
  isFavorite,
  material,
  onOpen,
  onToggleFavorite,
  variants,
}: MaterialCardProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  // Single thickness shows its label; several show the count; none hides the badge (D18)
  const badge =
    variants.length > 1 ? sprintf(t.variants, variants.length) : variants[0] ? getThicknessLabel(variants[0]) : null;

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
