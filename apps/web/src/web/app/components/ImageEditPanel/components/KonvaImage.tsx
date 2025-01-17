/* eslint-disable no-underscore-dangle */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import Konva from 'konva';
import { Filter } from 'konva/lib/Node';
import { Image } from 'react-konva';
import useImage from 'use-image';

interface Props {
  src: string;
  filters?: Array<Filter>;
}

export type KonvaImageRef = Konva.Image & { useImageStatus: 'loading' | 'loaded' | 'failed' };

const KonvaImage = forwardRef<KonvaImageRef, Props>(({ src, filters }, ref) => {
  const [image, useImageStatus] = useImage(src, 'anonymous');
  const imageRef = useRef<Konva.Image>(null);

  useImperativeHandle(
    ref,
    () =>
      Object.assign(imageRef.current, {
        useImageStatus,
        // these methods are under 3 levels of prototype chain, so expose them explicitly
        isCached: imageRef.current.isCached,
        _getCachedSceneCanvas: imageRef.current._getCachedSceneCanvas,
      }),
    [useImageStatus]
  );

  useEffect(() => {
    if (image) {
      imageRef.current.cache({ pixelRatio: 1 });
    }
  }, [image]);

  return <Image ref={imageRef} image={image} filters={filters} />;
});

export default KonvaImage;
