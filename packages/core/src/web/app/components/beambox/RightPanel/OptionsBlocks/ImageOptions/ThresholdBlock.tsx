import React, { memo, useCallback } from 'react';

import { ConfigProvider } from 'antd';
import classNames from 'classnames';

import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import ValueDisplay from '@core/app/components/beambox/RightPanel/common/ValueDisplay';
import { sliderTheme } from '@core/app/constants/antd-config';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { useAsyncTask } from '@core/helpers/hooks/useAsyncTask';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import OptionsInput from '../OptionsInput';

import styles from './ImageOptions.module.scss';

const config: NumberOptionConfig = {
  max: 255,
  min: 1,
  precision: 0,
};

interface Props {
  changeAttribute: (changes: { [key: string]: boolean | number | string }, addToHistory?: boolean) => void;
  generateImageData: (isShading: boolean, threshold: number) => Promise<string>;
  threshold: number;
}

const ThresholdBlock = ({ changeAttribute, generateImageData, threshold }: Props): React.JSX.Element => {
  const label = useI18n().beambox.right_panel.object_panel.option_panel.threshold;
  const isTablet = useIsTabletOrMobile();
  const { checkIsLatestCall, getNextCallID } = useAsyncTask();

  const handleThresholdChange = useCallback(
    async (val: null | number, addToHistory?: boolean) => {
      if (val === null) return;

      const callID = getNextCallID();
      const pngBase64 = await generateImageData(false, val);

      if (checkIsLatestCall(callID)) {
        changeAttribute(
          {
            'data-threshold': val,
            'xlink:href': pngBase64,
          },
          addToHistory,
        );
      }
    },
    [changeAttribute, checkIsLatestCall, generateImageData, getNextCallID],
  );

  return isTablet ? (
    <div>
      <Label extra={<ValueDisplay config={config} value={threshold} />}>{label}</Label>
      <Slider config={config} onChange={handleThresholdChange} value={threshold} />
      <InputNumberGroup buttonStep={5} config={config} onChange={handleThresholdChange} value={threshold} />
    </div>
  ) : (
    <>
      <div className={classNames(styles['option-block'], styles['with-slider'])}>
        <div className={styles.label}>{label}</div>
        <OptionsInput
          className={styles.input}
          height={20}
          onChange={handleThresholdChange}
          value={threshold}
          {...config}
        />
      </div>
      <ConfigProvider theme={sliderTheme}>
        <Slider config={config} onChange={handleThresholdChange} value={threshold} />
      </ConfigProvider>
    </>
  );
};

export default memo(ThresholdBlock);
