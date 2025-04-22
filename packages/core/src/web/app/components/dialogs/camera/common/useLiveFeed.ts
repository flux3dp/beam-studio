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

  useEffect(() => {
    if (cameraLive.current) {
      liveTimeout.current = setTimeout(() => {
        handleTakePicture({ silent: true });
        liveTimeout.current = undefined;
      }, 1000);
    }
  }, [img, handleTakePicture]);

  const pauseLive = useCallback(() => {
    cameraLive.current = false;
    clearTimeout(liveTimeout.current);
  }, []);

  useEffect(() => pauseLive, [pauseLive]);

  const restartLive = useCallback(() => {
    cameraLive.current = true;
    handleTakePicture({ silent: true });
  }, [handleTakePicture]);

  return { exposureSetting, handleTakePicture, img, pauseLive, restartLive, setExposureSetting };
};

export default useLiveFeed;
