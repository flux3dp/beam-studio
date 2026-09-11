import React from 'react';

import classNames from 'classnames';

import { showMaterialBrowser } from '@core/app/components/dialogs/MaterialBrowser/show';
import { CATEGORY_COLORS } from '@core/app/constants/material-catalog/constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { getThicknessLabel } from '@core/helpers/api/material-catalog/thickness';
import { getMaterialDisplayName, getPresetDisplayName } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './MaterialChip.module.scss';
import { useAppliedMaterial } from './useAppliedMaterial';

interface MaterialChipProps {
  UIType: 'default' | 'modal' | 'panel-item';
}

const MaterialChip = ({ UIType }: MaterialChipProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const module = useConfigPanelStore((state) => state.module.value);
  const { applied, isVarious } = useAppliedMaterial();
  const lang = useI18n().beambox.right_panel.laser_panel;

  const name = isVarious ? lang.various_preset : applied ? getMaterialDisplayName(applied.material) : t.manual;
  const sub = applied
    ? [applied.variant && getThicknessLabel(applied.variant), getPresetDisplayName(applied.preset)]
        .filter(Boolean)
        .join(' · ')
    : t.manual_settings;

  const openBrowser = () => showMaterialBrowser({ module, writeLayers: UIType !== 'modal' });

  if (UIType === 'panel-item') {
    return (
      <ObjectPanelItem.Item
        content={
          <div className={styles.chip} id="material-chip">
            <div className={styles.label}>
              <div className={styles.name}>{name}</div>
            </div>
          </div>
        }
        id="material-chip"
        label={t.title}
        onClick={openBrowser}
      />
    );
  }

  const swatchStyle: React.CSSProperties | undefined = applied
    ? applied.material.image
      ? { backgroundImage: `url(${applied.material.image})` }
      : { background: applied.material.coverColor ?? CATEGORY_COLORS[applied.material.category] }
    : undefined;

  return (
    <div className={styles.container}>
      <button
        className={styles.chip}
        id="material-chip"
        onClick={openBrowser}
        title={applied?.isModified ? t.modified : undefined}
        type="button"
      >
        <div className={classNames(styles.swatch, { [styles.manual]: !applied })} style={swatchStyle} />
        <div className={styles.label}>
          <div className={styles.name}>
            {name}
            {applied?.isModified && <span className={styles['modified-dot']} />}
          </div>
          <div className={styles.sub}>{sub}</div>
        </div>
      </button>
    </div>
  );
};

export default MaterialChip;
