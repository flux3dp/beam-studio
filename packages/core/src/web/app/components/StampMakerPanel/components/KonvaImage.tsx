import React, { useEffect, useImperativeHandle, useRef } from 'react';

import type Konva from 'konva';
import type { Filter } from 'konva/lib/Node';
import { Image } from 'react-konva';
import useImage from 'use-image';

interface Props {
  filters?: Filter[];
  horizontalFlip?: boolean;
  src: string;
}

export type KonvaImageRef = Konva.Image & { useImageStatus: 'failed' | 'loaded' | 'loading' };

const KonvaImage = ({ filters, horizontalFlip = false, ref, src }: Props & { ref?: React.Ref<KonvaImageRef> }) => {
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
    if (image && imageRef.current) {
      // Apply horizontal flip transformation
      const imageNode = imageRef.current;

      imageNode.scaleX(horizontalFlip ? -1 : 1);
      imageNode.offsetX(horizontalFlip ? image.width : 0);
      imageNode.cache({ pixelRatio: 1 });
    }
    // force redraw when image or transformations change
  }, [image, horizontalFlip]);

  return <Image fill={'white'} filters={filters} image={image} ref={imageRef} />;
};

export default KonvaImage;
