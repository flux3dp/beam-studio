import React, { useEffect, useMemo, useState } from 'react';

import { ConfigProvider, Slider, Switch } from 'antd';

import constant, { supportCameraAutoExposureModels } from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import versionChecker from '@core/helpers/version-checker';
import type { IConfigSetting } from '@core/interfaces/IDevice';

import styles from './PreviewSlider.module.scss';

const PreviewSlider = (): React.ReactNode => {
  const lang = useI18n().canvas_control;
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const [autoExposure, setAutoExposure] = useState<boolean | null>(null);
  const [isSettingAutoExposure, setIsSettingAutoExposure] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const { isDrawing, isPreviewMode, previewMode } = useCameraPreviewStore();

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

  const getSetting = async () => {
    if (!deviceMaster?.currentDevice?.info) return;

    const { model, version } = deviceMaster.currentDevice.info;
    const vc = versionChecker(version);

    if (!constant.fcodeV2Models.has(model)) return;

    const getExposureData = async () => {
      if (model === 'fbb2' && !vc.meetRequirement('BB2_SEPARATE_EXPOSURE')) return;

      try {
        setExposureSetting(await getExposureSettings());
      } catch (e) {
        console.error(e);
        setExposureSetting(null);
      }
    };

    const getAutoExposure = async () => {
      if (!supportCameraAutoExposureModels.includes(model)) return;

      if (model === 'fbb2' && !vc.meetRequirement('BB2_AUTO_EXPOSURE')) return;

      try {
        if (useGlobalPreferenceStore.getState()['use-auto-exposure']) await deviceMaster.setCameraExposureAuto(true);

        const res = await deviceMaster.getCameraExposureAuto();

        if (res?.success) setAutoExposure(res.data);
      } catch (e) {
        console.error(e);
        setAutoExposure(null);
      }
    };

    getExposureData();
    getAutoExposure();
    setIsRawMode(deviceMaster.currentControlMode === 'raw');
  };

  // this is also triggered by UPDATE_CONTEXT event in PreviewModeController.start
  useEffect(() => {
    setExposureSetting(null);
    setAutoExposure(null);

    if (isPreviewMode) getSetting();
  }, [isPreviewMode]);

  const showAutoExposure = useMemo(() => {
    if (autoExposure === null) return false;

    if (previewMode === PreviewMode.FULL_AREA && deviceMaster.currentDevice?.info.model === 'fbm2') return false;

    return true;
  }, [autoExposure, previewMode]);

  if (!exposureSetting) {
    return <div className={styles.notSupported}>{lang.not_supported}</div>;
  }

  return (
    <ConfigProvider
      theme={{ components: { Slider: { trackBgDisabled: '#bfbfbf' } }, token: { colorPrimary: '#1890ff' } }}
    >
      <Slider
        className={styles.slider}
        disabled={(isRawMode && isDrawing) || (Boolean(autoExposure) && showAutoExposure)}
        max={Math.min(exposureSetting.max, 2000)}
        min={Math.max(exposureSetting.min, 50)}
        onChange={(value: number) => setExposureSetting({ ...exposureSetting, value })}
        onChangeComplete={async (value: number) => {
          if (isRawMode && isDrawing) return;

          setExposureSetting({ ...exposureSetting, value });
          try {
            await setExposure(value);
          } catch (e) {
            console.error(e);
          }

          if (PreviewModeController.isFullArea) await PreviewModeController.previewFullWorkarea();
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
  );
};

export default PreviewSlider;
