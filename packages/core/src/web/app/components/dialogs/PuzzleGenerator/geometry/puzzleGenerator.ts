import { match } from 'ts-pattern';

import {
  DEFAULT_JITTER,
  DEFAULT_TAB_JITTER,
  ORIENTATION_SEEDS,
  TAB_DEPTH_MULTIPLIER,
  VISIBILITY_MERGE_THRESHOLD,
} from '../constants';
import type {
  MergeGroup,
  PieceVisibility,
  PuzzleEdges,
  PuzzleLayout,
  PuzzleState,
  ShapeType,
  TabJitter,
} from '../types';

import { DEFAULT_MERGE_STRATEGY } from './merging';
import { isPointInShape } from './shapes';

interface PuzzleJitterMap {
  horizontal: TabJitter[][];
  vertical: TabJitter[][];
}

// --- Helpers ---
const fmt = (n: number) => n.toFixed(2);
const uniform = (random: () => number, min: number, max: number): number => min + random() * (max - min);
const getTabSizeFraction = (val: number) => (val * 0.4) / 100;
const createSeededRandom = (seed: number) => {
  let curr = seed;

  return () => {
    const x = Math.sin(curr++) * 10000;

    return x - Math.floor(x);
  };
};
/** Generate a single tab edge using cubic Bezier curves with jitter */
const generateTabCurve = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tabSize: number,
  flip: boolean,
  jitter: TabJitter = DEFAULT_TAB_JITTER,
): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return '';

  const [wx, wy] = [-dy / len, dx / len];
  const flipSign = flip ? 1.0 : -1.0;
  const t = tabSize;
  const { depthOffset, entryOffset, exitOffset, neckOffset, shoulderOffset } = jitter;

  // Calculate point along edge with perpendicular offset
  const point = (along: number, perp: number) => ({
    x: x1 + dx * along + wx * perp * len * flipSign,
    y: y1 + dy * along + wy * perp * len * flipSign,
  });

  // Control points for three cubic Bezier curves forming the tab
  const pts = [
    point(0.2, entryOffset),
    point(0.5 + neckOffset + shoulderOffset, -t + depthOffset),
    point(0.5 - t + neckOffset, t + depthOffset),
    point(0.5 - 2 * t + neckOffset - shoulderOffset, TAB_DEPTH_MULTIPLIER * t + depthOffset),
    point(0.5 + 2 * t + neckOffset - shoulderOffset, TAB_DEPTH_MULTIPLIER * t + depthOffset),
    point(0.5 + t + neckOffset, t + depthOffset),
    point(0.5 + neckOffset + shoulderOffset, -t + depthOffset),
    point(0.8, exitOffset),
    point(1.0, 0),
  ];

  const formatPoint = (p: { x: number; y: number }) => `${fmt(p.x)} ${fmt(p.y)}`;
  const curve = (i: number) => `C ${formatPoint(pts[i])} ${formatPoint(pts[i + 1])} ${formatPoint(pts[i + 2])}`;

  return `${curve(0)} ${curve(3)} ${curve(6)}`;
};

const getTabFlip = (row: number, col: number, orientation: keyof typeof ORIENTATION_SEEDS): boolean => {
  const base = (row + col) % 2 === 0;

  return match(orientation)
    .with(1, () => base)
    .with(2, () => !base)
    .with(3, () => (row % 2 === 0 ? base : !base))
    .with(4, () => (col % 2 === 0 ? base : !base))
    .exhaustive();
};

/**
 * Calculates how much of a piece is inside the boundary shape.
 * Uses dense grid sampling for accurate visibility at curved boundaries.
 *
 * The calculation focuses on the piece body (the square region) rather than tabs,
 * as this better reflects the visual "usability" of a piece.
 */
const calculatePieceVisibility = (
  pRow: number,
  pCol: number,
  state: PuzzleState,
  shapeType: ShapeType,
  layout: PuzzleLayout,
  boundaryCornerRadius: number,
  centerYOffset: number,
  boundaryHeight: number,
): number => {
  const { pieceSize } = state;

  const [pL, pT] = [layout.offsetX + pCol * pieceSize, layout.offsetY + pRow * pieceSize];

  // Dense grid sampling (9×9 = 81 points) for accurate curved boundary detection
  const gridSize = 9;
  const gridSamples = Array.from({ length: gridSize ** 2 }, (_, i) => ({
    x: pL + ((i % gridSize) + 0.5) * (pieceSize / gridSize),
    y: pT + (Math.floor(i / gridSize) + 0.5) * (pieceSize / gridSize),
  }));

  // Also sample the 4 corners for edge accuracy
  const corners = [
    { x: pL, y: pT },
    { x: pL + pieceSize, y: pT },
    { x: pL, y: pT + pieceSize },
    { x: pL + pieceSize, y: pT + pieceSize },
  ];

  const allSamples = [...gridSamples, ...corners];
  const insideCount = allSamples.filter((s) =>
    isPointInShape(s.x, s.y, shapeType, layout.width, boundaryHeight, boundaryCornerRadius, centerYOffset),
  ).length;

  return insideCount / allSamples.length;
};

/** Resolve coordinates, jitter, and flip for a specific grid edge. */
const getEdgeData = (
  r: number,
  c: number,
  isVert: boolean,
  state: PuzzleState,
  layout: PuzzleLayout,
  jitterMap?: PuzzleJitterMap,
) => {
  const { orientation, pieceSize } = state;
  const { offsetX, offsetY } = layout;

  // Calculate start/end points based on orientation
  const x1 = offsetX + (isVert ? c + 1 : c) * pieceSize;
  const y1 = offsetY + (isVert ? r : r + 1) * pieceSize;
  const x2 = offsetX + (c + 1) * pieceSize;
  const y2 = offsetY + (r + 1) * pieceSize;

  // Resolve Jitter and Flip
  // Horizontal edges use (r, c), Vertical edges use (c, r) for map indexing
  const jitter = isVert ? jitterMap?.vertical[c]?.[r] : jitterMap?.horizontal[r]?.[c];

  const flip = jitter?.flip ?? (isVert ? !getTabFlip(r, c + 1, orientation) : getTabFlip(r + 1, c, orientation));

  return { flip, jitter, x1, x2, y1, y2 };
};

// --- Exported Functions ---
/** Generate jitter coefficients for all edges to create natural-looking tabs */
export const generateJitterMap = (
  rows: number,
  cols: number,
  orientation: 1 | 2 | 3 | 4,
  jitter = DEFAULT_JITTER,
): PuzzleJitterMap => {
  const random = createSeededRandom(ORIENTATION_SEEDS[orientation]);
  const gen = (count1: number, count2: number) =>
    Array.from({ length: count1 }, () => {
      let prevE = uniform(random, -jitter, jitter);
      let prevFlip = random() > 0.5;

      return Array.from({ length: count2 }, () => {
        const flip = random() > 0.5;
        const tabJitter: TabJitter = {
          depthOffset: uniform(random, -jitter, jitter),
          entryOffset: flip === prevFlip ? prevE : -prevE,
          exitOffset: uniform(random, -jitter, jitter),
          flip,
          neckOffset: uniform(random, -jitter, jitter),
          shoulderOffset: uniform(random, -jitter, jitter),
        };

        [prevE, prevFlip] = [tabJitter.exitOffset, flip];

        return tabJitter;
      });
    });

  return { horizontal: gen(rows - 1, cols), vertical: gen(cols - 1, rows) };
};

/** Calculate puzzle dimensions and centering offset */
export const calculatePuzzleLayout = (state: PuzzleState) => {
  const width = state.columns * state.pieceSize;
  const height = state.rows * state.pieceSize;

  return { height, offsetX: -width / 2, offsetY: -height / 2, width };
};

export const generatePuzzleEdges = (
  state: PuzzleState,
  layout: PuzzleLayout,
  mergeGroups: MergeGroup[] = [],
): PuzzleEdges => {
  const jitterMap = generateJitterMap(state.rows, state.columns, state.orientation);
  const t = getTabSizeFraction(state.tabSize);

  // Pre-build O(1) lookup for shared edges (both directions)
  const sharedEdges = new Set(
    mergeGroups.flatMap((g) =>
      g.sharedEdges.flatMap((e) => [
        `${e.row1}-${e.col1}:${e.row2}-${e.col2}`,
        `${e.row2}-${e.col2}:${e.row1}-${e.col1}`,
      ]),
    ),
  );

  const genEdges = (isVert: boolean) => {
    const paths: string[] = [];
    const [maj, sec] = isVert ? [state.columns, state.rows] : [state.rows, state.columns];

    for (let i = 1; i < maj; i++) {
      let data = '';
      let active = false;

      for (let j = 0; j < sec; j++) {
        const [r1, c1, r2, c2] = isVert ? [j, i - 1, j, i] : [i - 1, j, i, j];

        if (sharedEdges.has(`${r1}-${c1}:${r2}-${c2}`)) {
          active = false;
          continue;
        }

        const { flip, jitter, x1, x2, y1, y2 } = getEdgeData(r1, c1, isVert, state, layout, jitterMap);

        if (!active) {
          data += ` M ${fmt(x1)} ${fmt(y1)}`;
          active = true;
        }

        data +=
          t > 0
            ? //
              ` ${generateTabCurve(x1, y1, x2, y2, t, flip, jitter)}`
            : ` L ${fmt(x2)} ${fmt(y2)}`;
      }

      if (data) {
        paths.push(data);
      }
    }

    return paths.join('');
  };

  return {
    horizontalEdges: genEdges(false),
    verticalEdges: genEdges(true),
  };
};

export const calculateAllPieceVisibilities = (
  state: PuzzleState,
  shapeType: ShapeType,
  layout: PuzzleLayout,
  centerYOffset: number,
  boundaryHeight: number,
  boundaryCornerRadius: number,
): PieceVisibility[] => {
  const { columns, rows } = state;

  return Array.from({ length: rows * columns }, (_, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);

    return {
      col,
      row,
      visibleRatio: calculatePieceVisibility(
        row,
        col,
        state,
        shapeType,
        layout,
        boundaryCornerRadius,
        centerYOffset,
        boundaryHeight,
      ),
    };
  });
};

export const calculateMergeGroups = (
  visibility: PieceVisibility[],
  rows: number,
  cols: number,
  threshold = VISIBILITY_MERGE_THRESHOLD,
): MergeGroup[] => DEFAULT_MERGE_STRATEGY.calculateMergeGroups(visibility, rows, cols, threshold);
