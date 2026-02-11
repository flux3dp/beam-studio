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

import { getShapeMetadata, isPointInShape } from './shapeGenerators';

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
  centerYOffset: number = 0,
  boundaryHeight?: number,
): PieceVisibility[] => {
  const meta = getShapeMetadata(shapeType, state);
  const effectiveHeight = boundaryHeight ?? layout.height;

  if (meta.fillsBoundingBox) {
    return Array.from({ length: state.rows * state.columns }, (_, i) => ({
      col: i % state.columns,
      row: Math.floor(i / state.columns),
      visibleRatio: 1,
    }));
  }

  return Array.from({ length: state.rows * state.columns }, (_, i) => ({
    col: i % state.columns,
    row: Math.floor(i / state.columns),
    visibleRatio: calculatePieceVisibility(
      Math.floor(i / state.columns),
      i % state.columns,
      state,
      shapeType,
      layout,
      meta.boundaryCornerRadius,
      centerYOffset,
      effectiveHeight,
    ),
  }));
};

export const calculateMergeGroups = (
  visibility: PieceVisibility[],
  rows: number,
  cols: number,
  threshold = VISIBILITY_MERGE_THRESHOLD,
): MergeGroup[] => {
  const groups: MergeGroup[] = [];
  const mergedMap = new Map<string, number>();

  const getKey = (r: number, c: number) => `${r}-${c}`;
  const visibilityMap = new Map(visibility.map((v) => [getKey(v.row, v.col), v]));
  const getVisibility = (r: number, c: number) => visibilityMap.get(getKey(r, c))?.visibleRatio ?? 0;

  /** Check if a piece exists and has visibility (basic bounds check) */
  const exists = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && getVisibility(r, c) > 0;

  /** Check if a piece can be added to a group (exists, not already in ANY group) */
  const canAddToGroup = (r: number, c: number) => exists(r, c) && !mergedMap.has(getKey(r, c));

  /** Create a new group with two pieces */
  const createGroup = (r1: number, c1: number, r2: number, c2: number) => {
    const groupIdx =
      groups.push({
        pieces: [
          { col: c1, row: r1 },
          { col: c2, row: r2 },
        ],
        sharedEdges: [{ col1: c1, col2: c2, row1: r1, row2: r2 }],
      }) - 1;

    mergedMap.set(getKey(r1, c1), groupIdx);
    mergedMap.set(getKey(r2, c2), groupIdx);

    return groupIdx;
  };

  /** Add a piece to an existing group */
  const addToGroup = (r: number, c: number, fromR: number, fromC: number, groupIdx: number) => {
    groups[groupIdx].pieces.push({ col: c, row: r });
    groups[groupIdx].sharedEdges.push({ col1: c, col2: fromC, row1: r, row2: fromR });
    mergedMap.set(getKey(r, c), groupIdx);
  };

  const horizontalDirs = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
  ];

  /**
   * Find best mergeable neighbor in given directions.
   * For symmetry: prefer merging INWARD (toward center) when visibility is equal.
   */
  const centerCol = (cols - 1) / 2;

  const findBestNeighbor = (
    r: number,
    c: number,
    directions: Array<{ dc: number; dr: number }>,
  ): null | { c: number; r: number } => {
    const neighbors = directions
      .map((d) => ({ c: c + d.dc, r: r + d.dr }))
      .filter((n) => exists(n.r, n.c))
      .map((n) => ({ ...n, vis: getVisibility(n.r, n.c) }));

    if (neighbors.length === 0) return null;

    const best = neighbors.reduce((a, b) => {
      if (b.vis !== a.vis) return b.vis > a.vis ? b : a;

      // Equal visibility - prefer the one closer to center (inward merge)
      const aDist = Math.abs(a.c - centerCol);
      const bDist = Math.abs(b.c - centerCol);

      return bDist < aDist ? b : a;
    });

    return best;
  };

  /** Mirror a column index across the center axis */
  const mirrorCol = (c: number) => cols - 1 - c;

  /**
   * Expand a group horizontally until total visibility >= threshold.
   * For symmetry: prefer expanding OUTWARD (away from center) to avoid competing
   * with the mirror group for center-adjacent pieces.
   */
  const expandGroup = (groupIdx: number) => {
    const group = groups[groupIdx];
    let total = group.pieces.reduce((s, p) => s + getVisibility(p.row, p.col), 0);

    while (total < threshold) {
      const candidates: Array<{ fromC: number; fromR: number; nc: number; nr: number; vis: number }> = [];

      for (const p of group.pieces) {
        for (const d of horizontalDirs) {
          const [nr, nc] = [p.row + d.dr, p.col + d.dc];

          if (!canAddToGroup(nr, nc)) continue;

          candidates.push({ fromC: p.col, fromR: p.row, nc, nr, vis: getVisibility(nr, nc) });
        }
      }

      if (candidates.length === 0) break;

      // Pick best candidate: highest visibility, then OUTWARD (away from center)
      // Outward preference prevents one side from monopolizing center-adjacent pieces
      const best = candidates.reduce((a, b) => {
        if (b.vis !== a.vis) return b.vis > a.vis ? b : a;

        const aDist = Math.abs(a.nc - centerCol);
        const bDist = Math.abs(b.nc - centerCol);

        return bDist > aDist ? b : a;
      });

      addToGroup(best.nr, best.nc, best.fromR, best.fromC, groupIdx);
      total += best.vis;
    }
  };

  /**
   * Create or join a group for a piece merging toward a target neighbor.
   * Returns { groupIdx, isNew } or undefined if the piece was already merged.
   */
  const mergeToward = (r: number, c: number, targetC: number): undefined | { groupIdx: number; isNew: boolean } => {
    if (mergedMap.has(getKey(r, c))) return undefined;

    if (!exists(r, targetC)) return undefined;

    const existingGroupIdx = mergedMap.get(getKey(r, targetC));

    if (existingGroupIdx !== undefined) {
      addToGroup(r, c, r, targetC, existingGroupIdx);

      return { groupIdx: existingGroupIdx, isNew: false };
    }

    return { groupIdx: createGroup(r, c, r, targetC), isNew: true };
  };

  /** Try to merge a single piece with its best horizontal neighbor */
  const tryMerge = (r: number, c: number) => {
    const best = findBestNeighbor(r, c, horizontalDirs);

    if (!best) return;

    const result = mergeToward(r, c, best.c);

    if (result?.isNew) expandGroup(result.groupIdx);
  };

  /**
   * Process a symmetric pair of pieces simultaneously.
   * Both merge in mirrored directions, then expand new groups.
   */
  const processSymmetricPair = (r: number, leftC: number, rightC: number) => {
    const leftDone = mergedMap.has(getKey(r, leftC));
    const rightDone = mergedMap.has(getKey(r, rightC));

    if (leftDone && rightDone) return;

    // Find best neighbor for the left piece (use it as the canonical direction)
    if (!leftDone) {
      const best = findBestNeighbor(r, leftC, horizontalDirs);

      if (best) {
        const dc = best.c - leftC;

        // Merge left piece in direction dc
        const leftResult = mergeToward(r, leftC, leftC + dc);

        // Mirror: merge right piece in direction -dc
        if (!rightDone) {
          const rightResult = mergeToward(r, rightC, rightC - dc);

          if (rightResult?.isNew) expandGroup(rightResult.groupIdx);
        }

        if (leftResult?.isNew) expandGroup(leftResult.groupIdx);
      } else if (!rightDone) {
        tryMerge(r, rightC);
      }
    } else if (!rightDone) {
      tryMerge(r, rightC);
    }
  };

  /**
   * Process a center-column piece symmetrically.
   * When both horizontal neighbors exist, merges with both to form a symmetric group.
   */
  const processCenterPiece = (r: number, c: number) => {
    if (mergedMap.has(getKey(r, c))) return;

    const leftC = c - 1;
    const rightC = c + 1;
    const leftExists = exists(r, leftC);
    const rightExists = exists(r, rightC);

    if (leftExists && rightExists) {
      // Both neighbors exist — create a 3-piece symmetric group
      const leftGroupIdx = mergedMap.get(getKey(r, leftC));
      const rightGroupIdx = mergedMap.get(getKey(r, rightC));

      if (leftGroupIdx !== undefined) {
        addToGroup(r, c, r, leftC, leftGroupIdx);

        if (rightGroupIdx === undefined) {
          addToGroup(r, rightC, r, c, leftGroupIdx);
        }
      } else if (rightGroupIdx !== undefined) {
        addToGroup(r, c, r, rightC, rightGroupIdx);
        addToGroup(r, leftC, r, c, rightGroupIdx);
      } else {
        const groupIdx = createGroup(r, c, r, leftC);

        addToGroup(r, rightC, r, c, groupIdx);
        expandGroup(groupIdx);
      }
    } else {
      // Only one neighbor exists — merge with whichever is available
      const target = leftExists ? leftC : rightExists ? rightC : null;

      if (target !== null) {
        const result = mergeToward(r, c, target);

        if (result?.isNew) expandGroup(result.groupIdx);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Pass 1: Horizontal merging — symmetric pair processing
  //
  // Process pieces in symmetric pairs to ensure left/right produce mirrored
  // merge groups. When a piece merges in direction dc, its mirror counterpart
  // merges in direction -dc. Expansion prefers outward to avoid competing
  // for center-adjacent pieces.
  // ─────────────────────────────────────────────────────────────────────────────
  const sortedByVisibility = [...visibility]
    .filter((v) => v.visibleRatio && v.visibleRatio < threshold)
    .sort((a, b) => {
      // Primary: sort by visibility (smallest first)
      if (a.visibleRatio !== b.visibleRatio) return a.visibleRatio - b.visibleRatio;

      // Secondary: sort by distance from center (outer pieces first for symmetric processing)
      const aDist = Math.abs(a.col - centerCol);
      const bDist = Math.abs(b.col - centerCol);

      if (aDist !== bDist) return bDist - aDist;

      // Tertiary: sort by row for consistency
      return a.row - b.row;
    });

  const processed = new Set<string>();

  for (const v of sortedByVisibility) {
    if (processed.has(getKey(v.row, v.col))) continue;

    const mc = mirrorCol(v.col);
    const isOnCenter = v.col === mc;

    processed.add(getKey(v.row, v.col));

    if (!isOnCenter) {
      processed.add(getKey(v.row, mc));
    }

    if (isOnCenter) {
      processCenterPiece(v.row, v.col);
    } else {
      processSymmetricPair(v.row, v.col, mc);
    }
  }

  return groups.filter((g) => g.pieces.length > 1);
};
