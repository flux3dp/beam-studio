import type { ConfigItem, ILayerConfig } from '@core/interfaces/ILayerConfig';

export interface InnerEngravingBlocks {
  /** Dotting time and point spacing */
  dot: boolean;
  /** Layer spacing: the Z step of line mode, the shell step of solid dot mode */
  layerSpacing: boolean;
  /** Speed and adaptive spacing */
  line: boolean;
  /** Solid switch */
  solid: boolean;
}

const NONE: InnerEngravingBlocks = { dot: false, layerSpacing: false, line: false, solid: false };

/**
 * Which inner engraving parameters apply to the selected layers.
 *
 * The layer's mode decides. A photo plane is always dotted whatever the mode, so a layer holding
 * one shows the dot parameters too. A selection mixing modes shows both sets. The items are absent
 * outside inner engraving, where nothing is shown.
 */
const getInnerEngravingBlocks = (
  { stlMode, stlSolid }: Partial<Pick<ILayerConfig, 'stlMode' | 'stlSolid'>>,
  { hasStlPhoto, isInnerEngraving }: { hasStlPhoto: boolean; isInnerEngraving: boolean },
): InnerEngravingBlocks => {
  if (!isInnerEngraving) return NONE;

  const isMixed = (item?: ConfigItem<unknown>) => Boolean(item?.hasMultiValue);
  const line = stlMode?.value === 'line' || isMixed(stlMode);
  const dot = stlMode?.value !== 'line' || isMixed(stlMode);
  const isSolid = Boolean(stlSolid?.value) || isMixed(stlSolid);

  return { dot: dot || hasStlPhoto, layerSpacing: line || (dot && isSolid), line, solid: dot };
};

export default getInnerEngravingBlocks;
