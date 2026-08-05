import React, { useCallback, useEffect, useRef, useState } from 'react';

import constant, { supportCameraAutoExposureModels } from '@core/app/actions/beambox/constant';
import ExposureSlider from '@core/app/components/dialogs/camera/common/ExposureSlider';
import { getExposureSettings } from '@core/helpers/device/camera/cameraExposure';
import getDevice from '@core/helpers/device/get-device';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import versionChecker from '@core/helpers/version-checker';
import type { IConfigSetting, IDeviceInfo } from '@core/interfaces/IDevice';

import { usePrintAndCutStore } from '../store';

const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');

/** Wait until deviceMaster's control socket is connected to the given device. */
const waitForDeviceConnected = async (uuid: string, timeoutMs = 15000): Promise<boolean> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { currentDevice } = deviceMaster;

    if (currentDevice?.info?.uuid === uuid && currentDevice.control?.isConnected) return true;

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return false;
};

/**
 * Camera exposure controls for the align step, so a failed mark detection can
 * be retried with a different exposure. Selects/connects the device on mount
 * and reloads the settings after every align run and on device switch.
 */
const ExposureControl = (): React.ReactNode => {
  const isProcessing = usePrintAndCutStore((state) => state.isProcessing);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const [autoExposure, setAutoExposure] = useState<boolean | null>(null);
  /** Device the current settings were loaded from */
  const loadedUuidRef = useRef<null | string>(null);
  const isLoadingRef = useRef(false);

  // mirrors PreviewSlider's support gating
  const loadExposureSettings = useCallback(
    async (targetDevice?: IDeviceInfo) => {
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;

      try {
        // the device-switch event carries the authoritative new device; a
        // getDevice lookup would still resolve to the old one at emit time
        let info: IDeviceInfo | null | undefined = targetDevice;

        if (!info) {
          const { device } = await getDevice();

          info = device ? deviceMaster.currentDevice?.info : null;
        }

        loadedUuidRef.current = info?.uuid ?? null;

        if (!info || !constant.fcodeV2Models.has(info.model)) {
          setExposureSetting(null);
          setAutoExposure(null);

          return;
        }

        // the selection flow that emitted the event is still connecting the
        // device; wait instead of racing it with our own connect
        if (targetDevice && !(await waitForDeviceConnected(targetDevice.uuid))) {
          setExposureSetting(null);
          setAutoExposure(null);

          return;
        }

        const vc = versionChecker(info.version);

        if (info.model !== 'fbb2' || vc.meetRequirement('BB2_SEPARATE_EXPOSURE')) {
          try {
            setExposureSetting(await getExposureSettings());
          } catch (error) {
            console.error('Failed to get camera exposure setting', error);
            setExposureSetting(null);
          }
        } else {
          setExposureSetting(null);
        }

        if (
          supportCameraAutoExposureModels.includes(info.model) &&
          (info.model !== 'fbb2' || vc.meetRequirement('BB2_AUTO_EXPOSURE'))
        ) {
          try {
            const res = await deviceMaster.getCameraExposureAuto();

            setAutoExposure(res?.success ? res.data : null);
          } catch (error) {
            console.error('Failed to get camera auto exposure', error);
            setAutoExposure(null);
          }
        } else {
          setAutoExposure(null);
        }
      } finally {
        isLoadingRef.current = false;
      }
    },
    [setAutoExposure, setExposureSetting],
  );

  // reload on device switch — exposure support and settings are per-device;
  // the isLoadingRef guard ignores the emit from our own load's selection
  useEffect(() => {
    const onDeviceSelected = (device: IDeviceInfo | null) => {
      // don't race an ongoing run on the control socket; the load effect
      // below reloads when the run finishes
      if (usePrintAndCutStore.getState().isProcessing) return;

      if (device && device.uuid !== loadedUuidRef.current) loadExposureSettings(device);
    };

    topBarEventEmitter.on('SET_SELECTED_DEVICE', onDeviceSelected);

    return () => {
      topBarEventEmitter.removeListener('SET_SELECTED_DEVICE', onDeviceSelected);
    };
  }, [loadExposureSettings]);

  // on mount and after each run — the align flow awaits the preview-mode
  // teardown before flipping isProcessing, so the control socket is free
  useEffect(() => {
    if (isProcessing) return;

    loadExposureSettings();
  }, [isProcessing, loadExposureSettings]);

  if (isProcessing || !exposureSetting) return null;

  return (
    <ExposureSlider
      autoExposure={autoExposure}
      exposureSetting={exposureSetting}
      setAutoExposure={setAutoExposure}
      setExposureSetting={setExposureSetting}
    />
  );
};

export default ExposureControl;
