import type { Dispatch } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { supportCameraAutoExposureModels } from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import { getExposureSettings, setExposure } from '@core/helpers/device/camera/cameraExposure';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import versionChecker from '@core/helpers/version-checker';
import type { WebCamConnection } from '@core/helpers/webcam-helper';
import webcamHelper from '@core/helpers/webcam-helper';
import type { IConfigSetting } from '@core/interfaces/IDevice';

export type Options<T = null> = {
  firstImageArgs?: T;
  index?: number;
  initExposure?: number;
  source?: 'usb' | 'wifi';
  videoElement?: HTMLVideoElement;
};
export type HandleTakePictureArgs<T = null> = {
  callbackArgs?: T;
  retryTimes?: number;
  silent?: boolean;
};

const useCamera = <T>(
  handleImg?: (blob: Blob, args?: T) => boolean | Promise<boolean>,
  { firstImageArgs, index, initExposure, source = 'wifi', videoElement }: Options<T> = {},
): {
  autoExposure: boolean | null;
  connectWebCam: () => Promise<void>;
  exposureSetting: IConfigSetting | null;
  handleTakePicture: (opts?: HandleTakePictureArgs<T>) => Promise<Blob | null>;
  setAutoExposure: Dispatch<boolean | null>;
  setExposureSetting: Dispatch<IConfigSetting | null>;
  webCamConnection: null | WebCamConnection;
} => {
  const hasEnded = useRef(false);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const [autoExposure, setAutoExposure] = useState<boolean | null>(null);
  const webCamConnection = useRef<null | WebCamConnection>(null);
  const connectWebCam = useCallback(async () => {
    if (webCamConnection.current) {
      return;
    }

    try {
      webCamConnection.current = await webcamHelper.connectWebcam({ video: videoElement });
    } catch (error) {
      console.error('Failed to connect to webcam', error);
      alertCaller.popUpError({ message: `Failed to connect to webcam ${error instanceof Error ? error.message : ''}` });
    }
  }, [videoElement]);

  useEffect(() => {
    return () => {
      webCamConnection.current?.end();
    };
  }, []);

  const handleTakePicture = useCallback(
    async (opts?: HandleTakePictureArgs<T>) => {
      const { callbackArgs, retryTimes = 0, silent = false } = opts || {};

      if (!silent) {
        progressCaller.openNonstopProgress({
          id: 'use-camera',
          message: i18n.lang.calibration.taking_picture,
        });
      }

      let imgBlob: Blob | undefined = undefined;

      if (source === 'wifi') {
        imgBlob = (await deviceMaster.takeOnePicture())?.imgBlob;
      } else if (source === 'usb') {
        if (!webCamConnection.current) {
          await connectWebCam();
        }

        imgBlob = await webCamConnection.current?.getPicture();
      }

      if (!imgBlob) {
        if (hasEnded.current) return null;

        if (retryTimes < 2) return handleTakePicture({ retryTimes: retryTimes + 1, silent });

        alertCaller.popUpError({ message: 'Unable to get image' });

        if (!silent) progressCaller.popById('use-camera');

        return null;
      }

      if (handleImg) {
        const res = await handleImg(imgBlob, callbackArgs);

        if (!res && retryTimes < 2) {
          return handleTakePicture({ retryTimes: retryTimes + 1, silent });
        }
      }

      if (!silent) {
        progressCaller.popById('use-camera');
      }

      return imgBlob;
    },
    [connectWebCam, handleImg, source],
  );

  useEffect(() => {
    const initSetup = async () => {
      progressCaller.openNonstopProgress({
        id: 'use-camera',
        message: i18n.lang.calibration.taking_picture,
      });
      try {
        if (source === 'wifi') {
          await deviceMaster.connectCamera();

          if (index !== undefined) {
            try {
              const res = await deviceMaster.setCamera(index);

              if (!res) alertCaller.popUpError({ message: 'Failed to set camera' });
            } catch (e) {
              console.log('Failed to set camera', e);
              alertCaller.popUpError({ message: 'Failed to set camera' });
            }
          }

          try {
            if (initExposure !== undefined) await setExposure(initExposure);

            setExposureSetting(await getExposureSettings());
          } catch (e) {
            console.log('Failed to get exposure setting', e);
          }

          const getAutoExposure = async () => {
            const { model, version } = deviceMaster.currentDevice!.info;
            const vc = versionChecker(version);

            if (!supportCameraAutoExposureModels.includes(model)) return;

            if (model === 'fbb2' && !vc.meetRequirement('BB2_AUTO_EXPOSURE')) return;

            try {
              const res = await deviceMaster.getCameraExposureAuto();

              if (res?.success) setAutoExposure(res.data);
            } catch (e) {
              console.error('Failed to get auto exposure', e);
              setAutoExposure(null);
            }
          };

          await getAutoExposure();

          handleTakePicture({ callbackArgs: firstImageArgs });
        } else if (source === 'usb') {
          await connectWebCam();

          if (webCamConnection.current) {
            handleTakePicture();
          }
        }
      } finally {
        progressCaller.popById('use-camera');
      }
    };

    initSetup();

    return () => {
      hasEnded.current = true;

      if (source === 'wifi') {
        deviceMaster.disconnectCamera();
      } else if (source === 'usb') {
        webCamConnection.current?.end();
      }
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return {
    autoExposure,
    connectWebCam,
    exposureSetting,
    handleTakePicture,
    setAutoExposure,
    setExposureSetting,
    webCamConnection: webCamConnection.current,
  };
};

export default useCamera;
