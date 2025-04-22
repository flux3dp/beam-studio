import type { Dispatch } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { WebCamConnection } from '@core/helpers/webcam-helper';
import webcamHelper from '@core/helpers/webcam-helper';
import type { IConfigSetting } from '@core/interfaces/IDevice';

export type Options = { index?: number; source?: 'usb' | 'wifi' };

const useCamera = (
  handleImg?: (blob: Blob) => boolean | Promise<boolean>,
  { index = 0, source = 'wifi' }: Options = {},
): {
  exposureSetting: IConfigSetting | null;
  handleTakePicture: (opts?: { retryTimes?: number; silent?: boolean }) => void;
  setExposureSetting: Dispatch<IConfigSetting | null>;
} => {
  const hasEnded = useRef(false);
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const webCamConnection = useRef<null | WebCamConnection>(null);
  const connectWebCam = useCallback(async () => {
    if (webCamConnection.current) {
      return;
    }

    try {
      webCamConnection.current = await webcamHelper.connectWebcam();
    } catch (error) {
      console.error('Failed to connect to webcam', error);
      alertCaller.popUpError({ message: `Failed to connect to webcam ${error instanceof Error ? error.message : ''}` });
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

          if (index > 0) {
            try {
              const res = await deviceMaster.setCamera(index);

              if (!res) alertCaller.popUpError({ message: 'Failed to set camera' });
            } catch (e) {
              console.log('Failed to set camera', e);
              alertCaller.popUpError({ message: 'Failed to set camera' });
            }
          }

          try {
            const exposureRes = await deviceMaster.getDeviceSetting('camera_exposure_absolute');

            setExposureSetting(JSON.parse(exposureRes.value) as IConfigSetting);
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
      hasEnded.current = true;

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
