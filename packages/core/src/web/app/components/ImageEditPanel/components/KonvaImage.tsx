import React, { useEffect, useImperativeHandle, useRef } from 'react';

import type Konva from 'konva';
import type { Filter } from 'konva/lib/Node';
import { Image } from 'react-konva';
import useImage from 'use-image';

interface Props {
  cornerRadius?: number;
  filters?: Filter[];
  src: string;
}

export type KonvaImageRef = Konva.Image & { useImageStatus: 'failed' | 'loaded' | 'loading' };

const KonvaImage = ({ cornerRadius = 0, filters, ref, src }: Props & { ref?: React.Ref<KonvaImageRef> }) => {
  const [image, useImageStatus] = useImage(src, 'anonymous');
  const imageRef = useRef<Konva.Image>(null);

  useImperativeHandle(
    ref,
    () =>
      Object.assign(imageRef.current!, {
        _getCachedSceneCanvas: imageRef.current!._getCachedSceneCanvas,
        // these methods are under 3 levels of prototype chain, so expose them explicitly
        isCached: imageRef.current!.isCached,
        useImageStatus,
      }),
    [useImageStatus],
  );

  useEffect(() => {
    if (image) {
      imageRef.current!.cache({ pixelRatio: 1 });
    }
    // force redraw when image or cornerRadius changes
  }, [image, cornerRadius]);

  return <Image cornerRadius={cornerRadius} filters={filters} image={image} ref={imageRef} />;
};

export default KonvaImage;
