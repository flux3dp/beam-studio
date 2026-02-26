import paper from 'paper';
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
/**
 * Generate a single tab (knob) edge between two grid points using 3 cubic Bézier curves.
 *
 * The tab shape is constructed in edge-local coordinates:
 * - "along" = fraction (0→1) of the edge from (x1,y1) to (x2,y2)
 * - "perp"  = perpendicular offset (positive = tab protrudes outward)
 *
 * The 3 Bézier curves form:
 *   1. Entry slope (0.0→0.2→neck): gentle rise from edge into neck
 *   2. Tab body  (neck→bulge→neck): the wide interlocking knob
 *   3. Exit slope (neck→0.8→1.0): gentle descent back to edge
 */
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

/** Convert a Paper.js Path to SVG curve/line commands (no leading M). */
const paperPathToCurveCommands = (path: paper.Path): string => {
  const parts: string[] = [];

  for (let i = 0; i < path.segments.length - 1; i++) {
    const seg = path.segments[i];
    const next = path.segments[i + 1];
    const isLinear = seg.handleOut.isZero() && next.handleIn.isZero();

    if (isLinear) {
      parts.push(`L ${fmt(next.point.x)} ${fmt(next.point.y)}`);
    } else {
      const cp1x = seg.point.x + seg.handleOut.x;
      const cp1y = seg.point.y + seg.handleOut.y;
      const cp2x = next.point.x + next.handleIn.x;
      const cp2y = next.point.y + next.handleIn.y;

      parts.push(`C ${fmt(cp1x)} ${fmt(cp1y)} ${fmt(cp2x)} ${fmt(cp2y)} ${fmt(next.point.x)} ${fmt(next.point.y)}`);
    }
  }

  return parts.join(' ');
};

/**
 * Trim an edge path at boundary crossings, keeping only segments connected to the start/end vertices.
 * Uses Paper.js getIntersections + splitAt for exact Bézier curve splitting.
 *
 * Returns:
 * - startPathD: SVG curve commands (no M) for the segment connected to the start vertex
 * - endPathD: Full SVG (M + commands) for the segment connected to the end vertex
 */
const trimEdgePath = (
  edgePath: paper.Path,
  boundaryPath: paper.PathItem,
  startInside: boolean,
  endInside: boolean,
): { endPathD: null | string; startPathD: null | string } => {
  const intersections = edgePath.getIntersections(boundaryPath);

  if (intersections.length === 0) {
    // No actual crossings — return full path if start is inside, else nothing
    return {
      endPathD: null,
      startPathD: startInside ? paperPathToCurveCommands(edgePath) : null,
    };
  }

  const offsets = intersections.map((ix) => ix.offset).sort((a, b) => a - b);

  console.log('Intersections at offsets:', offsets);

  // Deduplicate near-coincident intersections (tangent touches)
  const epsilon = 0.001;
  const uniqueOffsets = offsets.filter((v, i) => i === 0 || v - offsets[i - 1] > epsilon);

  let startPathD: null | string = null;
  let endPathD: null | string = null;

  // Start segment: from edge start to first crossing
  if (startInside && uniqueOffsets.length > 0 && uniqueOffsets[0] > epsilon) {
    const clone = edgePath.clone({ insert: false }) as paper.Path;
    const tail = clone.splitAt(uniqueOffsets[0]);

    if (clone.segments.length > 1) {
      startPathD = paperPathToCurveCommands(clone);
    }

    clone.remove();

    if (tail) tail.remove();
  }

  // End segment: from last crossing to edge end
  if (endInside && uniqueOffsets.length > 0 && uniqueOffsets[uniqueOffsets.length - 1] < edgePath.length - epsilon) {
    const clone = edgePath.clone({ insert: false }) as paper.Path;
    const tail = clone.splitAt(uniqueOffsets[uniqueOffsets.length - 1]) as null | paper.Path;

    if (tail && tail.segments.length > 1) {
      const startPt = tail.segments[0].point;

      endPathD = `M ${fmt(startPt.x)} ${fmt(startPt.y)} ${paperPathToCurveCommands(tail)}`;
    }

    clone.remove();

    if (tail) tail.remove();
  }

  return { endPathD, startPathD };
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
  boundaryPathData: string,
  visibility: PieceVisibility[] = [],
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

  // Pre-build O(1) visibility lookup — pieces with visibleRatio < 1 are near the boundary
  const visMap = new Map(visibility.map((v) => [`${v.row}-${v.col}`, v.visibleRatio]));
  const isPieceClipped = (r: number, c: number) => (visMap.get(`${r}-${c}`) ?? 0) < 1;

  // Set up Paper.js for boundary-crossing edge trimming (non-rectangle shapes)
  const paperProject: paper.Project = new paper.Project(document.createElement('canvas'));
  const paperBoundary: paper.PathItem = new paper.Path(boundaryPathData);

  const genEdges = (isVert: boolean) => {
    const paths: string[] = [];
    const [maj, sec] = isVert ? [state.columns, state.rows] : [state.rows, state.columns];

    for (let i = 1; i < maj; i++) {
      let data = '';
      let isDrawing = false;

      for (let j = 0; j < sec; j++) {
        const [r1, c1, r2, c2] = isVert ? [j, i - 1, j, i] : [i - 1, j, i, j];

        if (sharedEdges.has(`${r1}-${c1}:${r2}-${c2}`)) {
          isDrawing = false;
          continue;
        }

        const { flip, jitter, x1, x2, y1, y2 } = getEdgeData(r1, c1, isVert, state, layout, jitterMap);

        // Trim edges near the boundary: if both adjacent pieces are not fully inside,
        // the edge might cross the boundary and tabs could create isolated slivers
        const needsTrim = t > 0 && isPieceClipped(r1, c1) && isPieceClipped(r2, c2);

        if (needsTrim) {
          const edgeSvg = `M ${fmt(x1)} ${fmt(y1)} ${generateTabCurve(x1, y1, x2, y2, t, flip, jitter)}`;
          const edgePath = new paper.Path(edgeSvg);
          const startInside = paperBoundary.contains(new paper.Point(x1, y1));
          const endInside = paperBoundary.contains(new paper.Point(x2, y2));
          const { endPathD, startPathD } = trimEdgePath(edgePath, paperBoundary!, startInside, endInside);

          if (startPathD) {
            if (!isDrawing) {
              data += ` M ${fmt(x1)} ${fmt(y1)}`;
            }

            data += ` ${startPathD}`;
          }

          if (endPathD) {
            data += ` ${endPathD}`;
            isDrawing = true; // cursor is at (x2, y2)
          } else {
            isDrawing = false;
          }

          edgePath.remove();
        } else {
          if (!isDrawing) {
            data += ` M ${fmt(x1)} ${fmt(y1)}`;
            isDrawing = true;
          }

          data += t > 0 ? ` ${generateTabCurve(x1, y1, x2, y2, t, flip, jitter)}` : ` L ${fmt(x2)} ${fmt(y2)}`;
        }
      }

      if (data) {
        paths.push(data);
      }
    }

    return paths.join('');
  };

  const result = {
    horizontalEdges: genEdges(false),
    verticalEdges: genEdges(true),
  };

  // Clean up Paper.js
  if (paperBoundary) paperBoundary.remove();

  if (paperProject) paperProject.remove();

  return result;
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
