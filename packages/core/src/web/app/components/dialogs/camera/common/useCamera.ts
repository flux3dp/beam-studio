import type { Dispatch } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { WebCamConnection } from '@core/helpers/webcam-helper';
import webcamHelper from '@core/helpers/webcam-helper';
import type { IConfigSetting } from '@core/interfaces/IDevice';

const useCamera = (
  handleImg?: (blob: Blob) => boolean | Promise<boolean>,
  source: 'usb' | 'wifi' = 'wifi',
): {
  exposureSetting: IConfigSetting | null;
  handleTakePicture: (opts?: { retryTimes?: number; silent?: boolean }) => void;
  setExposureSetting: Dispatch<IConfigSetting | null>;
} => {
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const webCamConnection = useRef<WebCamConnection>(null);
  const connectWebCam = useCallback(async () => {
    if (webCamConnection.current) {
      return;
    }

    try {
      webCamConnection.current = await webcamHelper.connectWebcam();
    } catch (error) {
      alertCaller.popUpError({ message: `Failed to connect to ${error.message}` });
    }
  }, []);

  const handleTakePicture = useCallback(
    async (opts?: { retryTimes?: number; silent?: boolean }) => {
      const { retryTimes = 0, silent = false } = opts || {};

      if (!silent) {
        progressCaller.openNonstopProgress({
          id: 'use-camera',
          message: i18n.lang.calibration.taking_picture,
        });
      }

      let imgBlob: Blob;

      if (source === 'wifi') {
        imgBlob = (await deviceMaster.takeOnePicture())?.imgBlob;
      } else if (source === 'usb') {
        if (!webCamConnection.current) {
          await connectWebCam();
        }

        imgBlob = await webCamConnection.current?.getPicture();
      }

      if (!imgBlob) {
        if (retryTimes < 2) {
          return handleTakePicture({ retryTimes: retryTimes + 1, silent });
        }

        alertCaller.popUpError({ message: 'Unable to get image' });

        if (!silent) {
          progressCaller.popById('use-camera');
        }

        return null;
      }

      if (handleImg) {
        const res = await handleImg(imgBlob);

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
          try {
            const exposureRes = await deviceMaster.getDeviceSetting('camera_exposure_absolute');

            setExposureSetting(JSON.parse(exposureRes.value));
          } catch (e) {
            console.log('Failed to get exposure setting', e);
          }
          handleTakePicture();
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
      if (source === 'wifi') {
        deviceMaster.disconnectCamera();
      } else if (source === 'usb') {
        webCamConnection.current?.end();
      }
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return { exposureSetting, handleTakePicture, setExposureSetting };
};

export default useCamera;
