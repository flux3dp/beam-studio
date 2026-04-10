/** 10 SVG px = 1mm on canvas export */
export const PX_TO_MM_RATIO = 10;

export const PUNCH_HOLE_OFFSET = -3;

export const BASE_RECTANGLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 600">
  <rect x="10" y="10" width="280" height="580" rx="30" ry="30" fill="none" stroke="#000" stroke-width="4"/>
</svg>`;

/** Vertical gap (mm) between the base path and the standalone inner path in exploded view / export. */
export const EXPLODED_GAP_MM = 5;
export const EXPLODED_GAP_PX = EXPLODED_GAP_MM * PX_TO_MM_RATIO;

/**
 * Color sets for design (uniform black) and exploded view (visually distinct parts).
 */
export const KEYCHAIN_COLORS = {
  design: { base: '#000000', innerAlone: '#000000', innerPosition: '#000000' },
  exploded: { base: '#000000', innerAlone: '#52c41a', innerPosition: '#1890ff' },
} as const;

export type KeychainViewMode = keyof typeof KEYCHAIN_COLORS;
