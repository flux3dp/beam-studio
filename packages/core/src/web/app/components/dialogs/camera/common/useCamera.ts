import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';

import alertCaller from 'app/actions/alert-caller';
import deviceMaster from 'helpers/device-master';
import progressCaller from 'app/actions/progress-caller';
import i18n from 'helpers/i18n';
import webcamHelper, { WebCamConnection } from 'helpers/webcam-helper';
import { IConfigSetting } from 'interfaces/IDevice';

const useCamera = (
  handleImg?: (blob: Blob) => Promise<boolean> | boolean,
  source: 'wifi' | 'usb' = 'wifi'
): {
  exposureSetting: IConfigSetting | null;
  setExposureSetting: Dispatch<IConfigSetting | null>;
  handleTakePicture: (opts?: { retryTimes?: number; silent?: boolean }) => void;
} => {
  const [exposureSetting, setExposureSetting] = useState<IConfigSetting | null>(null);
  const webCamConnection = useRef<WebCamConnection>(null);
  const connectWebCam = useCallback(async () => {
    if (webCamConnection.current) return;
    try {
      webCamConnection.current = await webcamHelper.connectWebcam();
    } catch (error) {
      alertCaller.popUpError({ message: `Failed to connect to ${error.message}` });
    }
  }, []);

  const handleTakePicture = useCallback(
    async (opts?: { retryTimes?: number; silent?: boolean }) => {
      const { retryTimes = 0, silent = false } = opts || {};
      if (!silent)
        progressCaller.openNonstopProgress({
          id: 'use-camera',
          message: i18n.lang.calibration.taking_picture,
        });
      let imgBlob: Blob;
      if (source === 'wifi') {
        imgBlob = (await deviceMaster.takeOnePicture())?.imgBlob;
      } else if (source === 'usb') {
        if (!webCamConnection.current) await connectWebCam();
        imgBlob = await webCamConnection.current?.getPicture();
      }
      if (!imgBlob) {
        if (retryTimes < 2) return handleTakePicture({ retryTimes: retryTimes + 1, silent });
        alertCaller.popUpError({ message: 'Unable to get image' });
        if (!silent) progressCaller.popById('use-camera');
        return null;
      }
      if (handleImg) {
        const res = await handleImg(imgBlob);
        if (!res && retryTimes < 2)
          return handleTakePicture({ retryTimes: retryTimes + 1, silent });
      }
      if (!silent) progressCaller.popById('use-camera');
      return imgBlob;
    },
    [connectWebCam, handleImg, source]
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
          if (webCamConnection.current) handleTakePicture();
        }
      } finally {
        progressCaller.popById('use-camera');
      }
    };
    initSetup();
    return () => {
      if (source === 'wifi') deviceMaster.disconnectCamera();
      else if (source === 'usb') webCamConnection.current?.end();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { exposureSetting, setExposureSetting, handleTakePicture };
};

export default useCamera;
