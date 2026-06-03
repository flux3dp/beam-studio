import React, { memo, useCallback } from 'react';

import { Switch } from 'antd';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import useI18n from '@core/helpers/useI18n';

import styles from './ImageOptions.module.scss';

interface Props {
  changeAttribute: (changes: { [key: string]: boolean | number | string }) => void;
  generateImageData: (isShading: boolean, threshold: number) => Promise<string>;
  isGradient: boolean;
}

const GradientBlock = ({ changeAttribute, generateImageData, isGradient }: Props): React.JSX.Element => {
  const label = useI18n().beambox.right_panel.object_panel.option_panel.shading;
  const isMobile = useIsMobile();

  const handleGradientClick = useCallback(
    async (newVal: boolean) => {
      const threshold = newVal ? 254 : 128;
      const pngBase64 = await generateImageData(newVal, threshold);

      changeAttribute({
        'data-shading': newVal,
        'data-threshold': threshold,
        'xlink:href': pngBase64,
      });
      useLayerStore.getState().checkGradient();
    },
    [changeAttribute, generateImageData],
  );

  return isMobile ? (
    <ObjectPanelItem.Item
      content={<Switch checked={isGradient} />}
      id="gradient"
      label={label}
      onClick={() => handleGradientClick(!isGradient)}
    />
  ) : (
    <div className={styles['option-block']} key="gradient">
      <div className={styles.label}>{label}</div>
      <Switch checked={isGradient} onChange={handleGradientClick} size="small" />
    </div>
  );
};

export default memo(GradientBlock);
