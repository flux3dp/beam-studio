import React, { memo, useCallback } from 'react';

import Label from '@core/app/components/beambox/RightPanel/common/Label';
import Switch from '@core/app/components/beambox/RightPanel/common/Switch';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import useI18n from '@core/helpers/useI18n';

import styles from './ImageOptions.module.scss';

interface Props {
  changeAttribute: (changes: { [key: string]: boolean | number | string }) => void;
  generateImageData: (isShading: boolean, threshold: number) => Promise<string>;
  isGradient: boolean;
}

const GradientBlock = ({ changeAttribute, generateImageData, isGradient }: Props): React.JSX.Element => {
  const label = useI18n().beambox.right_panel.object_panel.option_panel.shading;
  const isTablet = useIsTabletOrMobile();

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

  return isTablet ? (
    <Label extra={<Switch checked={isGradient} onChange={handleGradientClick} />}>{label}</Label>
  ) : (
    <div className={styles['option-block']} key="gradient">
      <div className={styles.label}>{label}</div>
      <Switch checked={isGradient} onChange={handleGradientClick} />
    </div>
  );
};

export default memo(GradientBlock);
