/**
 * Canonical color sets for each view mode.
 * Used by the Konva preview (components/Preview) and the SVG export (geometry/svgExport).
 */
export const COLORS = {
  design: {
    boardBase: '#333333',
    fill: 'transparent',
    guideLines: '#333333',
    pieces: '#333333',
    raisedEdges: '#333333',
  },
  exploded: {
    boardBase: '#8bc34a',
    fill: 'transparent',
    guideLines: '#ffc107',
    pieces: '#f44336',
    raisedEdges: '#3f51b5',
  },
} as const;

export type ViewMode = keyof typeof COLORS;
export type ColorSet = (typeof COLORS)[ViewMode];
