import { useCallback, useEffect, useRef, useState } from 'react';

import type { Options } from './useCamera';
import useCamera from './useCamera';

const useLiveFeed = (opts?: Options) => {
  const [img, setImg] = useState<null | { blob: Blob; url: string }>(null);
  const cameraLive = useRef(true);
  const liveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
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

  const { exposureSetting, handleTakePicture, setExposureSetting } = useCamera(handleImg, opts);

  const setLiveTimeout = useCallback(() => {
    if (!cameraLive.current) return;

    if (liveTimeout.current) clearTimeout(liveTimeout.current);

    liveTimeout.current = setTimeout(async () => {
      liveTimeout.current = undefined;

      const res = await handleTakePicture({ silent: true });

      if (!res) setLiveTimeout();
    }, 1000);
  }, [handleTakePicture]);

  useEffect(() => {
    setLiveTimeout();
  }, [img, setLiveTimeout]);

  const pauseLive = useCallback(() => {
    cameraLive.current = false;
    clearTimeout(liveTimeout.current);
  }, []);

  useEffect(() => pauseLive, [pauseLive]);

  const restartLive = useCallback(() => {
    cameraLive.current = true;
    setLiveTimeout();
  }, [setLiveTimeout]);

  return { exposureSetting, handleTakePicture, img, pauseLive, restartLive, setExposureSetting };
};

export default useLiveFeed;
