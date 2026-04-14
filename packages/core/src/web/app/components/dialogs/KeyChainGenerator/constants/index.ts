/** 10 SVG px = 1mm on canvas export */
export const PX_TO_MM_RATIO = 10;

export const PUNCH_HOLE_OFFSET = -5;

export const INNER_ALIGN_OFFSET_MM = 0.1;
export const INNER_ALIGN_OFFSET_PX = INNER_ALIGN_OFFSET_MM * PX_TO_MM_RATIO;

/** Vertical gap (mm) between the base path and the standalone inner path in exploded view / export. */
export const EXPLODED_GAP_MM = 5;
export const EXPLODED_GAP_PX = EXPLODED_GAP_MM * PX_TO_MM_RATIO;

/**
 * Color sets for design (uniform black) and exploded view (visually distinct parts).
 */
export const KEYCHAIN_COLORS = {
  design: {
    base: '#000000',
    emboss: '#000000',
    embossAlign: '#000000',
    engraving: '#000000',
  },
  exploded: {
    base: '#000000',
    emboss: '#52c41a',
    embossAlign: '#1890ff',
    engraving: '#ff7a45',
  },
} as const;

export type KeychainViewMode = keyof typeof KEYCHAIN_COLORS;
