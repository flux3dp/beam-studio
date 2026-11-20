/**
 * How a galvo layer is divided between gantry stops (layer config `galvoTiling`).
 * Read by swiftray from `data-galvoTiling`; a missing or unknown value is Auto there too
 * (a swiftray from before Auto existed takes it as the grid).
 */
export const GalvoTiling = {
  /** Whole objects where they fit one field, the grid for the ones that do not. The default. */
  Auto: 'auto',
  /** Tile the layer on the machine lattice and blend the seams (the original behaviour). */
  Grid: 'grid',
  /** Engrave every first-level object of the layer whole, from one stop. */
  Object: 'object',
} as const;

export type GalvoTilingType = (typeof GalvoTiling)[keyof typeof GalvoTiling];
