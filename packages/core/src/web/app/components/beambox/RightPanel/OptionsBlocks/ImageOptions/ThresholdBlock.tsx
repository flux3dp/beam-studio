import React, { memo, use, useCallback, useMemo } from 'react';

import { ConfigProvider, InputNumber, Slider } from 'antd';
import { Popover } from 'antd-mobile';
import classNames from 'classnames';

import { ObjectPanelContext } from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { sliderTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsMobile } from '@core/app/stores/screenStore';
import { useAsyncTask } from '@core/helpers/hooks/useAsyncTask';
import useI18n from '@core/helpers/useI18n';

import OptionsInput from '../OptionsInput';

import styles from './ImageOptions.module.scss';

const config = {
  max: 255,
  min: 1,
  precision: 0,
};

interface Props {
  changeAttribute: (changes: { [key: string]: boolean | number | string }) => void;
  generateImageData: (isShading: boolean, threshold: number) => Promise<string>;
  threshold: number;
}

const ThresholdBlock = ({ changeAttribute, generateImageData, threshold }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const { activeKey } = use(ObjectPanelContext);
  const thresholdVisible = useMemo(() => activeKey === 'threshold', [activeKey]);
  const { checkIsLatestCall, getNextCallID } = useAsyncTask();

  const handleThresholdChange = useCallback(
    async (val: null | number) => {
      if (val === null) return;

      const callID = getNextCallID();
      const pngBase64 = await generateImageData(false, val);

      if (checkIsLatestCall(callID)) {
        changeAttribute({
          'data-threshold': val,
          'xlink:href': pngBase64,
        });
      }
    },
    [changeAttribute, checkIsLatestCall, generateImageData, getNextCallID],
  );

  return isMobile ? (
    <Popover
      content={
        <div className={styles.field}>
          <span className={styles.label}>{lang.threshold_short}</span>
          <ConfigProvider theme={{ token: { borderRadius: 100 } }}>
            <InputNumber
              className={styles.input}
              controls={false}
              onChange={handleThresholdChange}
              type="number"
              value={threshold}
              {...config}
            />
          </ConfigProvider>
          <Slider
            className={styles.slider}
            marks={{ 128: '128' }}
            onChange={handleThresholdChange}
            value={threshold}
            {...config}
          />
        </div>
      }
      visible={thresholdVisible}
    >
      <ObjectPanelItem.Item
        autoClose={false}
        content={<OptionPanelIcons.Threshold />}
        id="threshold"
        label={lang.threshold_short}
      />
    </Popover>
  ) : (
    <>
      <div className={classNames(styles['option-block'], styles['with-slider'])}>
        <div className={styles.label}>{lang.threshold}</div>
        <OptionsInput
          className={styles.input}
          height={20}
          onChange={handleThresholdChange}
          value={threshold}
          {...config}
        />
      </div>
      <ConfigProvider theme={sliderTheme}>
        <Slider onChange={handleThresholdChange} value={threshold} {...config} />
      </ConfigProvider>
    </>
  );
};

export default memo(ThresholdBlock);
