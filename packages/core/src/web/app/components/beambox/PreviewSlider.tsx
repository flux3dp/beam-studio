import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Slider, Space, Tooltip } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import versionChecker from '@core/helpers/version-checker';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './PreviewSlider.module.scss';

const PreviewSlider = (): React.ReactNode => {
  const [opacity, setOpacity] = useState(1);
  const [showOpacity, setShowOpacity] = useState(false);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const { mode } = useContext(CanvasContext);
  const isPreviewing = mode === CanvasMode.Preview;
  const { isPreviewMode } = useCameraPreviewStore();
  const lang = useI18n();

  const getSetting = async () => {
    if (!deviceMaster?.currentDevice?.info) {
      return;
    }

    const { model, version } = deviceMaster.currentDevice.info;
    const vc = versionChecker(version);

    if (!constant.fcodeV2Models.has(model)) return;

    if (model === 'fbb2' && !vc.meetRequirement('BB2_SEPARATE_EXPOSURE')) return;

    try {
      const currentMode = deviceMaster.currentControlMode;

      if (currentMode === 'raw') {
        const res = await deviceMaster.getCameraExposure();

        if (res?.success) {
          setExposureSetting({ max: 1000, min: 50, step: 1, value: res.data });
        }
      } else {
        if (currentMode !== '') {
          await deviceMaster.endSubTask();
        }

        const exposureRes = await deviceMaster.getDeviceSetting('camera_exposure_absolute');

        setExposureSetting(JSON.parse(exposureRes.value) as IConfigSetting);
      }
    } catch (e) {
      console.error('Failed to get exposure setting', e);
      setExposureSetting(null);
    }
  };

  const updateBgOpacity = useCallback((val: string) => {
    const container: null | SVGGElement = document.querySelector('#previewSvg');
    const bgImg: HTMLElement | null | undefined = container?.querySelector('#backgroundImage');

    if (container && bgImg) {
      container.style.opacity = val;
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

    if (isPreviewing && isPreviewMode) getSetting();
  }, [isPreviewing, isPreviewMode]);

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
            min={Math.max(exposureSetting.min, 50)}
            onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
            onChangeComplete={async (value: number) => {
              setExposureSetting({ ...exposureSetting, value });

              const currentMode = deviceMaster.currentControlMode;

              if (currentMode === 'raw') {
                try {
                  await deviceMaster.setCameraExposure(value);
                } catch (e) {
                  console.error('Failed to set exposure setting in raw mode', e);
                }
              } else {
                if (currentMode !== '') {
                  await deviceMaster.endSubTask();
                }

                await deviceMaster.setDeviceSetting('camera_exposure_absolute', value.toString());
              }

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
