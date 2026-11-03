/**
 * How a galvo layer is divided between gantry stops (layer config `galvoTiling`).
 * Read by swiftray from `data-galvoTiling`; a value it does not know falls back to the grid.
 */
export const GalvoTiling = {
  /** Tile the layer on the machine lattice and blend the seams (the original behaviour). */
  Grid: 'grid',
  /** Engrave every first-level object of the layer whole, from one stop. */
  Object: 'object',
} as const;

export type GalvoTilingType = (typeof GalvoTiling)[keyof typeof GalvoTiling];
