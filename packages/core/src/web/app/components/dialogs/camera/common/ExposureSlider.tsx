import type { Dispatch, ReactNode } from 'react';
import React from 'react';

import { Slider, Tooltip } from 'antd';
import classNames from 'classnames';

import progressCaller from '@core/app/actions/progress-caller';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './ExposureSlider.module.scss';

interface Props {
  className?: string;
  exposureSetting: IConfigSetting | null;
  onChanged?: () => void;
  setExposureSetting: Dispatch<IConfigSetting | null>;
}

const ExposureSlider = ({ className, exposureSetting, onChanged, setExposureSetting }: Props): ReactNode => {
  const lang = useI18n();

  if (!exposureSetting) {
    return null;
  }

  return (
    <div className={classNames(styles.container, className)}>
      <Tooltip title={lang.editor.exposure}>
        <WorkareaIcons.Exposure className={styles.icon} />
      </Tooltip>
      <Slider
        className={styles.slider}
        max={Math.min(exposureSetting.max, 1000)}
        min={Math.max(exposureSetting.min, 50)}
        onAfterChange={async (value: number) => {
          try {
            progressCaller.openNonstopProgress({ id: 'exposure-slider' });
            setExposureSetting({ ...exposureSetting, value });
            await deviceMaster.setDeviceSetting('camera_exposure_absolute', value.toString());
            onChanged?.();
          } finally {
            progressCaller.popById('exposure-slider');
          }
        }}
        onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
        step={exposureSetting.step}
        tooltip={{ open: false }}
        value={exposureSetting.value}
      />
    </div>
  );
};

export default ExposureSlider;
