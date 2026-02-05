import { match } from 'ts-pattern';

import type { PuzzleState, ShapeType } from '../types';

import { generateShapePath, getShapeMetadata, isPointInShape } from './shapeGenerators';

// --- Types ---

/** Jitter coefficients for a single tab edge */
export interface TabJitter {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  flip: boolean;
}

export interface PuzzleJitterMap {
  horizontal: TabJitter[][];
  vertical: TabJitter[][];
}

export interface PuzzleEdges {
  boundaryPath: string;
  horizontalEdges: string;
  verticalEdges: string;
}

export interface PieceVisibility {
  col: number;
  row: number;
  visibleRatio: number;
}

export interface MergeGroup {
  pieces: Array<{ col: number; row: number }>;
  sharedEdges: Array<{ col1: number; col2: number; row1: number; row2: number }>;
}

// --- Constants ---
const TAB_DEPTH_MULTIPLIER = 3.0;
const DEFAULT_JITTER = 0.04;
const DEFAULT_TAB_JITTER: TabJitter = { a: 0, b: 0, c: 0, d: 0, e: 0, flip: true };
const ORIENTATION_SEEDS: Record<1 | 2 | 3 | 4, number> = { 1: 1337, 2: 4242, 3: 7890, 4: 2468 };
const CARDINAL_DIRECTIONS = [
  { c: 1, r: 0 },
  { c: -1, r: 0 },
  { c: 0, r: 1 },
  { c: 0, r: -1 },
] as const;
const DIAGONAL_DIRECTIONS = [
  { dc: 1, dr: 1 },
  { dc: -1, dr: 1 },
  { dc: 1, dr: -1 },
  { dc: -1, dr: -1 },
] as const;

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
/**
 * Internal helper to resolve all metadata for a specific grid edge.
 * Acts as the single source of truth for both full-puzzle and per-piece generation.
 */
const getEdgeData = (
  r: number,
  c: number,
  isVert: boolean,
  state: PuzzleState,
  layout: ReturnType<typeof calculatePuzzleLayout>,
  jitterMap?: PuzzleJitterMap,
) => {
  const { orientation, pieceSize } = state;
  const { offsetX, offsetY } = layout;

  // Calculate start/end points based on orientation
  const x1 = offsetX + (isVert ? c + 1 : c) * pieceSize;
  const y1 = offsetY + (isVert ? r : r + 1) * pieceSize;
  const x2 = offsetX + (isVert ? c + 1 : c + 1) * pieceSize;
  const y2 = offsetY + (isVert ? r + 1 : r + 1) * pieceSize;

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
          a: flip === prevFlip ? prevE : -prevE,
          b: uniform(random, -jitter, jitter),
          c: uniform(random, -jitter, jitter),
          d: uniform(random, -jitter, jitter),
          e: uniform(random, -jitter, jitter),
          flip,
        };

        [prevE, prevFlip] = [tabJitter.e, flip];

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

export const isEdgeShared = (r1: number, c1: number, r2: number, c2: number, mergeGroups: MergeGroup[]) =>
  mergeGroups.some((g) =>
    g.sharedEdges.some(
      (e) =>
        (e.row1 === r1 && e.col1 === c1 && e.row2 === r2 && e.col2 === c2) ||
        (e.row1 === r2 && e.col1 === c2 && e.row2 === r1 && e.col2 === c1),
    ),
  );

/** Main generator function - routes to appropriate shape generator */
export const generatePuzzleEdges = (
  state: PuzzleState,
  shapeType: ShapeType,
  mergeGroups: MergeGroup[] = [],
): PuzzleEdges => {
  const { height, offsetX, offsetY, width } = calculatePuzzleLayout(state);
  const jitterMap = generateJitterMap(state.rows, state.columns, state.orientation);
  const t = getTabSizeFraction(state.tabSize);

  const genEdges = (isVert: boolean) => {
    const paths: string[] = [];
    const [maj, sec] = isVert ? [state.columns, state.rows] : [state.rows, state.columns];

    for (let i = 1; i < maj; i++) {
      let data = '';
      let active = false;

      for (let j = 0; j < sec; j++) {
        const [r1, c1, r2, c2] = isVert ? [j, i - 1, j, i] : [i - 1, j, i, j];

        if (isEdgeShared(r1, c1, r2, c2, mergeGroups)) {
          active = false;
          continue;
        }

        const { flip, jitter, x1, x2, y1, y2 } = getEdgeData(
          r1,
          c1,
          isVert,
          state,
          { height, offsetX, offsetY, width },
          jitterMap,
        );

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

  const meta = getShapeMetadata(shapeType, state);

  return {
    boundaryPath: generateShapePath(shapeType, { cornerRadius: meta.boundaryCornerRadius, height, width }),
    horizontalEdges: genEdges(false),
    verticalEdges: genEdges(true),
  };
};

export const calculateAllPieceVisibilities = (state: PuzzleState, shapeType: ShapeType): PieceVisibility[] =>
  Array.from({ length: state.rows * state.columns }, (_, i) => ({
    col: i % state.columns,
    row: Math.floor(i / state.columns),
    visibleRatio: calculatePieceVisibility(Math.floor(i / state.columns), i % state.columns, state, shapeType),
  }));

export const calculateMergeGroups = (
  visibility: PieceVisibility[],
  rows: number,
  cols: number,
  threshold = 0.5,
): MergeGroup[] => {
  const groups: MergeGroup[] = [];
  const mergedMap = new Map<string, number>();

  const getKey = (r: number, c: number) => `${r}-${c}`;
  const visibilityMap = new Map(visibility.map((v) => [getKey(v.row, v.col), v]));
  const getVisibility = (r: number, c: number) => visibilityMap.get(getKey(r, c));

  /** Internal helper to perform the actual data updates for a merge */
  const applyMerge = (sR: number, sC: number, tR: number, tC: number) => {
    const sKey = getKey(sR, sC);
    const tKey = getKey(tR, tC);
    const targetVisibility = getVisibility(tR, tC);

    if (tR < 0 || tR >= rows || tC < 0 || tC >= cols || mergedMap.has(sKey)) return false;

    if (!targetVisibility || targetVisibility.visibleRatio === 0) return false;

    // Join existing group or start a new one
    const gIdx = mergedMap.get(tKey);
    const group =
      gIdx !== undefined ? groups[gIdx] : groups[groups.push({ pieces: [{ col: tC, row: tR }], sharedEdges: [] }) - 1];

    group.pieces.push({ col: sC, row: sR });
    group.sharedEdges.push({ col1: sC, col2: tC, row1: sR, row2: tR });

    const finalIdx = gIdx ?? groups.length - 1;

    mergedMap.set(sKey, finalIdx);
    mergedMap.set(tKey, finalIdx);

    return true;
  };

  // Pass 0: Diagonal bridge for corners (<25%)
  visibility
    .filter((v) => v.visibleRatio > 0 && v.visibleRatio < 0.25)
    .forEach((v) => {
      DIAGONAL_DIRECTIONS.some((d) => {
        const [tr, tc] = [v.row + d.dr, v.col + d.dc];
        const bridge = [
          { c: tc, r: v.row },
          { c: v.col, r: tr },
        ].find((b) => getVisibility(b.r, b.c)?.visibleRatio && getVisibility(tr, tc)?.visibleRatio);

        if (!bridge) return false;

        return applyMerge(v.row, v.col, bridge.r, bridge.c) && applyMerge(tr, tc, bridge.r, bridge.c);
      });
    });

  // Pass 1 & 2: Cardinal Merges for small pieces
  visibility
    .filter((v) => v.visibleRatio > 0 && v.visibleRatio < threshold)
    .forEach((v) => {
      if (mergedMap.has(getKey(v.row, v.col))) return;

      CARDINAL_DIRECTIONS.some((n) => applyMerge(v.row, v.col, v.row + n.r, v.col + n.c));
    });

  // Pass 3: Expansion (>= 80% group visibility)
  groups.forEach((g) => {
    let total = g.pieces.reduce((s, p) => s + (getVisibility(p.row, p.col)?.visibleRatio || 0), 0);

    while (total < 0.8) {
      const expanded = g.pieces.some((p) =>
        CARDINAL_DIRECTIONS.some((n) => {
          const [nr, nc] = [p.row + n.r, p.col + n.c];
          const isOutOfBounds = nr < 0 || nr >= rows || nc < 0 || nc >= cols;
          const neighborVisibility = getVisibility(nr, nc)?.visibleRatio;

          if (isOutOfBounds || mergedMap.has(getKey(nr, nc)) || !neighborVisibility) {
            return false;
          }

          applyMerge(nr, nc, p.row, p.col);
          total += neighborVisibility;

          return true;
        }),
      );

      if (!expanded) break;
    }
  });

  return groups.filter((g) => g.pieces.length > 1);
};

// --- Internal Utilities (Not Exported) ---
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
  const { a, b, c, d, e } = jitter;

  // Calculate point along edge with perpendicular offset
  const point = (along: number, perp: number) => ({
    x: x1 + dx * along + wx * perp * len * flipSign,
    y: y1 + dy * along + wy * perp * len * flipSign,
  });

  // Control points for three cubic Bezier curves forming the tab
  const pts = [
    point(0.2, a),
    point(0.5 + b + d, -t + c),
    point(0.5 - t + b, t + c),
    point(0.5 - 2 * t + b - d, TAB_DEPTH_MULTIPLIER * t + c),
    point(0.5 + 2 * t + b - d, TAB_DEPTH_MULTIPLIER * t + c),
    point(0.5 + t + b, t + c),
    point(0.5 + b + d, -t + c),
    point(0.8, e),
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

/** * Calculates how much of a piece is inside the boundary shape.
 * Uses grid sampling, corner checks, and tab extension sampling.
 */
const calculatePieceVisibility = (pRow: number, pCol: number, state: PuzzleState, shapeType: ShapeType): number => {
  const meta = getShapeMetadata(shapeType, state);

  if (meta.fillsBoundingBox) return 1;

  const { columns, pieceSize, rows, tabSize } = state;
  const layout = calculatePuzzleLayout(state);
  const t = getTabSizeFraction(tabSize);

  const [pL, pT] = [layout.offsetX + pCol * pieceSize, layout.offsetY + pRow * pieceSize];
  const [pR, pB] = [pL + pieceSize, pT + pieceSize];
  const [cX, cY] = [(pL + pR) / 2, (pT + pB) / 2];

  // Define relative sample offsets (Grid + Corners + Tab Extensions)
  const sampleCount = 5;
  const gridSamples = Array.from({ length: sampleCount ** 2 }, (_, i) => ({
    x: pL + ((i % sampleCount) + 0.5) * (pieceSize / sampleCount),
    y: pT + (Math.floor(i / sampleCount) + 0.5) * (pieceSize / sampleCount),
  }));

  const corners = [
    { x: pL, y: pT },
    { x: pR, y: pT },
    { x: pL, y: pB },
    { x: pR, y: pB },
  ];

  const tabDistances = [1, 2, 3].map((m) => m * t * pieceSize);
  const tabSamples = [
    ...(pRow > 0 ? tabDistances.map((d) => ({ x: cX, y: pT - d })) : []),
    ...(pRow < rows - 1 ? tabDistances.map((d) => ({ x: cX, y: pB + d })) : []),
    ...(pCol > 0 ? tabDistances.map((d) => ({ x: pL - d, y: cY })) : []),
    ...(pCol < columns - 1 ? tabDistances.map((d) => ({ x: pR + d, y: cY })) : []),
  ];

  const allSamples = [...gridSamples, ...corners, ...tabSamples];
  const insideCount = allSamples.filter((s) =>
    isPointInShape(s.x, s.y, shapeType, layout.width, layout.height, meta.boundaryCornerRadius),
  ).length;

  return insideCount / allSamples.length;
};
