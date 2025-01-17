import classNames from 'classnames';
import React, { Dispatch } from 'react';
import { Slider, Tooltip } from 'antd';

import deviceMaster from 'helpers/device-master';
import progressCaller from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import WorkareaIcons from 'app/icons/workarea/WorkareaIcons';
import { IConfigSetting } from 'interfaces/IDevice';

import styles from './ExposureSlider.module.scss';

interface Props {
  className?: string;
  exposureSetting: IConfigSetting | null;
  setExposureSetting: Dispatch<IConfigSetting | null>;
  onChanged?: () => void;
}

const ExposureSlider = ({
  className,
  exposureSetting,
  setExposureSetting,
  onChanged,
}: Props): JSX.Element => {
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
        min={Math.max(exposureSetting.min, 250)}
        max={Math.min(exposureSetting.max, 650)}
        step={exposureSetting.step}
        value={exposureSetting.value}
        onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
        onAfterChange={async (value: number) => {
          try {
            progressCaller.openNonstopProgress({ id: 'exposure-slider' });
            setExposureSetting({ ...exposureSetting, value });
            await deviceMaster.setDeviceSetting('camera_exposure_absolute', value.toString());
            onChanged();
          } finally {
            progressCaller.popById('exposure-slider');
          }
        }}
        tooltip={{ open: false }}
      />
    </div>
  );
};

export default ExposureSlider;
