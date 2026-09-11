import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import type { EngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';

/** Unitless scale that preserves the physical size unless the safe XY area is smaller. */
export const getPathScale = (widthMm: number, heightMm: number, engravable: EngravableBox): number => {
  if (!engravable.isValid) return 1;

  const limits = [
    1,
    widthMm > 0 ? engravable.width / MM_TO_SCENE / widthMm : Infinity,
    heightMm > 0 ? engravable.depth / MM_TO_SCENE / heightMm : Infinity,
  ];

  const scale = Math.min(...limits);

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};
