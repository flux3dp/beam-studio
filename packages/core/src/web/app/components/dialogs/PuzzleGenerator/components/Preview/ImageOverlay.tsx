import React, { memo } from 'react';

import type Konva from 'konva';
import { Group, Image } from 'react-konva';

interface ImageOverlayProps {
  clipFunc?: (ctx: Konva.Context) => void;
  image: HTMLImageElement;
  layout: { height: number; width: number; x: number; y: number };
}

const ImageOverlay = memo(({ clipFunc, image, layout }: ImageOverlayProps) => (
  <Group clipFunc={clipFunc}>
    <Image height={layout.height} image={image} width={layout.width} x={layout.x} y={layout.y} />
  </Group>
));

ImageOverlay.displayName = 'ImageOverlay';

export default ImageOverlay;
