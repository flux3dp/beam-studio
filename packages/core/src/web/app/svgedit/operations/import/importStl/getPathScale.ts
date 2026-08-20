import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import type { EngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';

const MAX_ELEMENT_SIZE_MM = 50;

/** Millimetres per source SVG unit, capped at 50mm and fitted to the safe XY area. */
export const getPathScale = (width: number, height: number, engravable: EngravableBox): number => {
  const limits = [
    width > 0 ? MAX_ELEMENT_SIZE_MM / width : Infinity,
    height > 0 ? MAX_ELEMENT_SIZE_MM / height : Infinity,
  ];

  if (engravable.isValid) {
    limits.push(
      width > 0 ? engravable.width / MM_TO_SCENE / width : Infinity,
      height > 0 ? engravable.depth / MM_TO_SCENE / height : Infinity,
    );
  }

  const scale = Math.min(...limits);

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};
