import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ConfigProvider, Slider, Space, Switch, Tooltip } from 'antd';

import constant, { supportCameraAutoExposureModels } from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import versionChecker from '@core/helpers/version-checker';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './PreviewSlider.module.scss';

const PreviewSlider = (): React.ReactNode => {
  const [opacity, setOpacity] = useState(1);
  const [showOpacity, setShowOpacity] = useState(false);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const [autoExposure, setAutoExposure] = useState<boolean | null>(null);
  const [isSettingAutoExposure, setIsSettingAutoExposure] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const { isDrawing, isPreviewMode, previewMode } = useCameraPreviewStore();
  const lang = useI18n();

  const getSetting = async () => {
    if (!deviceMaster?.currentDevice?.info) {
      return;
    }

    const { model, version } = deviceMaster.currentDevice.info;
    const vc = versionChecker(version);

    if (!constant.fcodeV2Models.has(model)) return;

    const getExposure = async () => {
      if (model === 'fbb2' && !vc.meetRequirement('BB2_SEPARATE_EXPOSURE')) return;

      try {
        setExposureSetting(await getExposureSettings());
      } catch (e) {
        console.error('Failed to get exposure setting', e);
        setExposureSetting(null);
      }
    };

    const getAutoExposure = async () => {
      if (!supportCameraAutoExposureModels.includes(model)) return;

      if (model === 'fbb2' && !vc.meetRequirement('BB2_AUTO_EXPOSURE')) return;

      try {
        if (useGlobalPreferenceStore.getState()['use-auto-exposure']) {
          await deviceMaster.setCameraExposureAuto(true);
        }

        const res = await deviceMaster.getCameraExposureAuto();

        if (res?.success) setAutoExposure(res.data);
      } catch (e) {
        console.error('Failed to get auto exposure', e);
        setAutoExposure(null);
      }
    };

    getExposure();
    getAutoExposure();
    setIsRawMode(deviceMaster.currentControlMode === 'raw');
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
    updateBgOpacity(isPreviewMode ? '1' : opacity.toString());
  }, [isPreviewMode, opacity, updateBgOpacity]);

  // this is also triggered by UPDATE_CONTEXT event in PreviewModeController.start
  useEffect(() => {
    setExposureSetting(null);
    setAutoExposure(null);

    if (isPreviewMode) getSetting();
  }, [isPreviewMode]);

  const toggleAutoExposure = async (value: boolean) => {
    if (isSettingAutoExposure) return;

    try {
      useGlobalPreferenceStore.getState().set('use-auto-exposure', false);
      setIsSettingAutoExposure(true);

      const res = await deviceMaster?.setCameraExposureAuto(value);

      if (res) setAutoExposure(value);
    } catch (e) {
      console.error('Failed to set auto exposure', e);
    } finally {
      setIsSettingAutoExposure(false);
    }
  };

  const showAutoExposure = useMemo(() => {
    if (autoExposure === null) return false;

    if (previewMode === PreviewMode.FULL_SCREEN && deviceMaster.currentDevice?.info.model === 'fbm2') return false;

    return true;
  }, [autoExposure, previewMode]);

  return (
    <Space className={styles.space} direction="vertical">
      {!isPreviewMode && showOpacity && (
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
      {isPreviewMode && exposureSetting && (
        <div className={styles.container}>
          <Tooltip title={lang.editor.exposure}>
            <WorkareaIcons.Exposure className={styles.icon} />
          </Tooltip>
          <ConfigProvider
            theme={{
              components: { Slider: { trackBgDisabled: '#bfbfbf' } },
              token: { colorPrimary: '#1890ff', colorTextQuaternary: '#c0c0c0', colorTextTertiary: '#8c8c8c' },
            }}
          >
            <Slider
              className={styles.slider}
              disabled={(isRawMode && isDrawing) || (showAutoExposure && Boolean(autoExposure))}
              max={Math.min(exposureSetting.max, 2000)}
              min={Math.max(exposureSetting.min, 50)}
              onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
              onChangeComplete={async (value: number) => {
                if (isRawMode && isDrawing) return;

                setExposureSetting({ ...exposureSetting, value });

                try {
                  await setExposure(value);
                } catch (e) {
                  console.error('Failed to set exposure', e);
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
            {showAutoExposure && (
              <Switch
                checkedChildren="A"
                className={styles.switch}
                disabled={isDrawing}
                loading={isSettingAutoExposure}
                onChange={toggleAutoExposure}
                unCheckedChildren="M"
                value={autoExposure!}
              />
            )}
          </ConfigProvider>
        </div>
      )}
    </Space>
  );
};

export default PreviewSlider;
