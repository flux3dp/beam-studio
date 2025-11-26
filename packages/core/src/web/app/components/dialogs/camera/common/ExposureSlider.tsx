import type { Dispatch, ReactNode } from 'react';
import React, { useState } from 'react';

import { Slider, Switch, Tooltip } from 'antd';
import classNames from 'classnames';

import progressCaller from '@core/app/actions/progress-caller';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './ExposureSlider.module.scss';

interface Props {
  autoExposure: boolean | null;
  className?: string;
  exposureSetting: IConfigSetting | null;
  onChanged?: () => void;
  onRetakePicture?: () => void;
  setAutoExposure: Dispatch<boolean | null>;
  setExposureSetting: Dispatch<IConfigSetting | null>;
}

const ExposureSlider = ({
  autoExposure,
  className,
  exposureSetting,
  onChanged,
  onRetakePicture,
  setAutoExposure,
  setExposureSetting,
}: Props): ReactNode => {
  const lang = useI18n();
  const [isSettingAutoExposure, setIsSettingAutoExposure] = useState(false);

  const toggleAutoExposure = async (value: boolean) => {
    if (isSettingAutoExposure) return;

    try {
      setIsSettingAutoExposure(true);

      const res = await deviceMaster?.setCameraExposureAuto(value);

      if (res) {
        setAutoExposure(value);
        onChanged?.();
      }
    } catch (e) {
      console.error('Failed to set auto exposure', e);
    } finally {
      setIsSettingAutoExposure(false);
    }
  };

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
              disabled={Boolean(autoExposure)}
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
          {autoExposure !== null && (
            <Switch
              checkedChildren="A"
              className={styles.switch}
              loading={isSettingAutoExposure}
              onChange={toggleAutoExposure}
              unCheckedChildren="M"
              value={autoExposure}
            />
          )}
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
