import type { Dispatch, ReactNode } from 'react';
import React from 'react';

import { Slider, Tooltip } from 'antd';
import classNames from 'classnames';

import progressCaller from '@core/app/actions/progress-caller';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { setExposure } from '@core/helpers/device/camera/cameraExposure';
import useI18n from '@core/helpers/useI18n';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './ExposureSlider.module.scss';

interface Props {
  className?: string;
  exposureSetting: IConfigSetting | null;
  onChanged?: () => void;
  onRetakePicture?: () => void;
  setExposureSetting: Dispatch<IConfigSetting | null>;
}

const ExposureSlider = ({
  className,
  exposureSetting,
  onChanged,
  onRetakePicture,
  setExposureSetting,
}: Props): ReactNode => {
  const lang = useI18n();

  return (
    <div className={classNames(styles.container, className)}>
      {exposureSetting && (
        <>
          <div className={styles.main}>
            <Tooltip title={lang.editor.exposure}>
              <WorkareaIcons.Exposure className={styles.icon} />
            </Tooltip>
            <Slider
              className={styles.slider}
              max={Math.min(exposureSetting.max, 2000)}
              min={Math.max(exposureSetting.min, 50)}
              onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
              onChangeComplete={async (value: number) => {
                try {
                  progressCaller.openNonstopProgress({ id: 'exposure-slider' });
                  setExposureSetting({ ...exposureSetting, value });
                  await setExposure(value);

                  onChanged?.();
                } finally {
                  progressCaller.popById('exposure-slider');
                }
              }}
              step={exposureSetting.step}
              tooltip={{ open: false }}
              value={exposureSetting.value}
            />
          </div>
          <div className={styles.value}>{exposureSetting.value}</div>
        </>
      )}
      {onRetakePicture && (
        <Tooltip title={lang.calibration.retake}>
          <LeftPanelIcons.Camera className={styles.retake} onClick={() => onRetakePicture()} />
        </Tooltip>
      )}
    </div>
  );
};

export default ExposureSlider;
