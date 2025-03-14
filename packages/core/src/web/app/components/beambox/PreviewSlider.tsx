import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Slider, Space, Tooltip } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import deviceMaster from '@core/helpers/device-master';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './PreviewSlider.module.scss';

const PreviewSlider = (): React.ReactNode => {
  const [opacity, setOpacity] = useState(1);
  const [showOpacity, setShowOpacity] = useState(false);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const { mode } = useContext(CanvasContext);
  const isPreviewing = mode === CanvasMode.Preview;
  const lang = useI18n();

  const getSetting = async () => {
    if (!deviceMaster?.currentDevice?.info) {
      return;
    }

    const { model } = deviceMaster.currentDevice.info;

    if (!(constant.adorModels.includes(model) || (model === 'fbb2' && isDev()))) {
      return;
    }

    try {
      const control = await deviceMaster.getControl();

      if (control.getMode() !== '') {
        await deviceMaster.endSubTask();
      }

      const exposureRes = await deviceMaster.getDeviceSetting('camera_exposure_absolute');

      setExposureSetting(JSON.parse(exposureRes.value));
    } catch (e) {
      console.error('Failed to get exposure setting', e);
    }
  };

  const updateBgOpacity = useCallback((val: string) => {
    const bgImg: HTMLElement | null = document.querySelector('#background_image');

    if (bgImg) {
      bgImg.style.opacity = val;
      setShowOpacity(true);
    } else {
      setShowOpacity(false);
    }
  }, []);

  useEffect(() => {
    updateBgOpacity(isPreviewing ? '1' : opacity.toString());
  }, [isPreviewing, opacity, updateBgOpacity]);

  // this is also triggered by UPDATE_CONTEXT event in PreviewModeController.start
  useEffect(() => {
    setExposureSetting(null);

    if (isPreviewing && PreviewModeController.isPreviewModeOn) {
      getSetting();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isPreviewing, PreviewModeController.isPreviewModeOn]);

  if (mode === CanvasMode.PathPreview) {
    return null;
  }

  return (
    <Space className={styles.space} direction="vertical">
      {!isPreviewing && showOpacity && (
        <div className={styles.container}>
          <Tooltip title={lang.editor.opacity}>
            <WorkareaIcons.Opacity className={styles.icon} />
          </Tooltip>
          <Slider
            className={styles.slider}
            max={1}
            min={0}
            onChange={setOpacity}
            step={0.25}
            tooltip={{ open: false }}
            value={opacity}
          />
          <div className={styles.value}>{opacity * 100}%</div>
        </div>
      )}
      {isPreviewing && exposureSetting && (
        <div className={styles.container}>
          <Tooltip title={lang.editor.exposure}>
            <WorkareaIcons.Exposure className={styles.icon} />
          </Tooltip>
          <Slider
            className={styles.slider}
            max={Math.min(exposureSetting.max, 1000)}
            min={Math.max(exposureSetting.min, 250)}
            onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
            onChangeComplete={async (value: number) => {
              setExposureSetting({ ...exposureSetting, value });

              const control = await deviceMaster.getControl();

              if (control.getMode() !== '') {
                await deviceMaster.endSubTask();
              }

              await deviceMaster.setDeviceSetting('camera_exposure_absolute', value.toString());

              if (PreviewModeController.isFullScreen) {
                await PreviewModeController.previewFullWorkarea();
              }
            }}
            step={exposureSetting.step}
            tooltip={{ open: false }}
            value={exposureSetting.value}
          />
          <div className={styles.value}>{exposureSetting.value}</div>
        </div>
      )}
    </Space>
  );
};

export default PreviewSlider;
