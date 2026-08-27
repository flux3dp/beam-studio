import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import type { EngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';

/** Millimetres per source SVG unit, fitted to the full safe XY area. */
export const getPathScale = (width: number, height: number, engravable: EngravableBox): number => {
  if (!engravable.isValid) return 1;

  const limits = [
    width > 0 ? engravable.width / MM_TO_SCENE / width : Infinity,
    height > 0 ? engravable.depth / MM_TO_SCENE / height : Infinity,
  ];

  const scale = Math.min(...limits);

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};
