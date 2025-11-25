import { useCallback, useEffect, useRef, useState } from 'react';

import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';

import type { Options } from './useCamera';
import useCamera from './useCamera';

const useLiveFeed = (opts?: Options) => {
  const [img, setImg] = useState<null | { blob: Blob; url: string }>(null);
  const cameraLive = useRef(true);
  const liveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const { source = 'wifi', videoElement } = opts || {};
  const handleImg = useCallback((imgBlob: Blob) => {
    const url = URL.createObjectURL(imgBlob);

    setImg({ blob: imgBlob, url });

    return true;
  }, []);

  useEffect(
    () => () => {
      if (img?.url) URL.revokeObjectURL(img.url);
    },
    [img],
  );

  const { autoExposure, exposureSetting, handleTakePicture, setAutoExposure, setExposureSetting, webCamConnection } =
    useCamera(handleImg, opts);

  const setLiveTimeout = useCallback(() => {
    if (!cameraLive.current || source === 'usb') return;

    if (liveTimeout.current) clearTimeout(liveTimeout.current);

    liveTimeout.current = setTimeout(async () => {
      liveTimeout.current = undefined;

      const res = await handleTakePicture({ silent: true });

      if (!res) setLiveTimeout();
    }, 1000);
  }, [handleTakePicture, source]);

  useDidUpdateEffect(() => {
    if (source !== 'usb') setLiveTimeout();
  }, [img, setLiveTimeout, source]);

  const pauseLive = useCallback(() => {
    if (source === 'usb') {
      videoElement?.pause();

      return;
    }

    cameraLive.current = false;
    clearTimeout(liveTimeout.current);
  }, [source, videoElement]);

  useEffect(() => pauseLive, [pauseLive]);

  const restartLive = useCallback(() => {
    if (source === 'usb') {
      videoElement?.play();

      return;
    }

    cameraLive.current = true;
    setLiveTimeout();
  }, [setLiveTimeout, source, videoElement]);

  return {
    autoExposure,
    exposureSetting,
    handleTakePicture,
    img,
    pauseLive,
    restartLive,
    setAutoExposure,
    setExposureSetting,
    webCamConnection,
  };
};

export default useLiveFeed;
