import type { ConfigItem, ILayerConfig } from '@core/interfaces/ILayerConfig';

export interface InnerEngravingBlocks {
  /** The interval of the top and bottom face fill */
  capInterval: boolean;
  /** Dotting time and point spacing */
  dot: boolean;
  /** The top and bottom face fill switch */
  fillCaps: boolean;
  /** Layer spacing: the Z step of line mode, the shell step of solid dot mode */
  layerSpacing: boolean;
  /** Speed and adaptive spacing */
  line: boolean;
  /** Solid switch */
  solid: boolean;
}

const NONE: InnerEngravingBlocks = {
  capInterval: false,
  dot: false,
  fillCaps: false,
  layerSpacing: false,
  line: false,
  solid: false,
};

/**
 * Which inner engraving parameters apply to the selected layers.
 *
 * The layer's mode decides. The face fill belongs to line mode, its interval only shows while it is
 * on. A photo plane is always dotted whatever the mode, so a layer holding
 * one shows the dot parameters too. A selection mixing modes shows both sets. The items are absent
 * outside inner engraving, where nothing is shown.
 */
const getInnerEngravingBlocks = (
  { stlFillCaps, stlMode, stlSolid }: Partial<Pick<ILayerConfig, 'stlFillCaps' | 'stlMode' | 'stlSolid'>>,
  { hasStlPhoto, isInnerEngraving }: { hasStlPhoto: boolean; isInnerEngraving: boolean },
): InnerEngravingBlocks => {
  if (!isInnerEngraving) return NONE;

  const isMixed = (item?: ConfigItem<unknown>) => Boolean(item?.hasMultiValue);
  const line = stlMode?.value === 'line' || isMixed(stlMode);
  const dot = stlMode?.value !== 'line' || isMixed(stlMode);
  const isSolid = Boolean(stlSolid?.value) || isMixed(stlSolid);
  const fillsCaps = Boolean(stlFillCaps?.value) || isMixed(stlFillCaps);

  return {
    capInterval: line && fillsCaps,
    dot: dot || hasStlPhoto,
    fillCaps: line,
    layerSpacing: line || (dot && isSolid),
    line,
    solid: dot,
  };
};

export default getInnerEngravingBlocks;
