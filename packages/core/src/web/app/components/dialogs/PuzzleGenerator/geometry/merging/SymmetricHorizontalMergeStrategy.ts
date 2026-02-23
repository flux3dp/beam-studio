/**
 * Symmetric Horizontal Merge Strategy
 *
 * Merges small pieces horizontally while preserving left/right symmetry.
 * Uses symmetric pair processing: when a piece on the left merges in direction dc,
 * its mirror counterpart merges in direction -dc.
 *
 * Key features:
 * - Horizontal-only merging (no vertical merges)
 * - Symmetric pair processing for visual balance
 * - Inward preference during neighbor selection (toward center)
 * - Outward preference during group expansion (away from center)
 * - Center-column pieces can form 3-piece symmetric groups
 */

import type { MergeGroup, PieceVisibility } from '../../types';

import type { MergeStrategy } from './types';

export class SymmetricHorizontalMergeStrategy implements MergeStrategy {
  calculateMergeGroups(visibility: PieceVisibility[], rows: number, cols: number, threshold: number): MergeGroup[] {
    const groups: MergeGroup[] = [];
    const mergedMap = new Map<string, number>();

    const getKey = (r: number, c: number) => `${r}-${c}`;
    const visibilityMap = new Map(visibility.map((v) => [getKey(v.row, v.col), v]));
    const getVisibility = (r: number, c: number) => visibilityMap.get(getKey(r, c))?.visibleRatio ?? 0;

    const exists = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && getVisibility(r, c) > 0;

    const canAddToGroup = (r: number, c: number) => exists(r, c) && !mergedMap.has(getKey(r, c));

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

    const addToGroup = (r: number, c: number, fromR: number, fromC: number, groupIdx: number) => {
      groups[groupIdx].pieces.push({ col: c, row: r });
      groups[groupIdx].sharedEdges.push({ col1: c, col2: fromC, row1: r, row2: fromR });
      mergedMap.set(getKey(r, c), groupIdx);
    };

    const horizontalDirs = [
      { dc: 1, dr: 0 },
      { dc: -1, dr: 0 },
    ];

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

        const aDist = Math.abs(a.c - centerCol);
        const bDist = Math.abs(b.c - centerCol);

        return bDist < aDist ? b : a;
      });

      return best;
    };

    const mirrorCol = (c: number) => cols - 1 - c;

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

    const tryMerge = (r: number, c: number) => {
      const best = findBestNeighbor(r, c, horizontalDirs);

      if (!best) return;

      const result = mergeToward(r, c, best.c);

      if (result?.isNew) expandGroup(result.groupIdx);
    };

    const processSymmetricPair = (r: number, leftC: number, rightC: number) => {
      const leftDone = mergedMap.has(getKey(r, leftC));
      const rightDone = mergedMap.has(getKey(r, rightC));

      if (leftDone && rightDone) return;

      if (!leftDone) {
        const best = findBestNeighbor(r, leftC, horizontalDirs);

        if (best) {
          const dc = best.c - leftC;

          const leftResult = mergeToward(r, leftC, leftC + dc);

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

    const processCenterPiece = (r: number, c: number) => {
      if (mergedMap.has(getKey(r, c))) return;

      const leftC = c - 1;
      const rightC = c + 1;
      const leftExists = exists(r, leftC);
      const rightExists = exists(r, rightC);

      if (leftExists && rightExists) {
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
        const target = leftExists ? leftC : rightExists ? rightC : null;

        if (target !== null) {
          const result = mergeToward(r, c, target);

          if (result?.isNew) expandGroup(result.groupIdx);
        }
      }
    };

    const sortedByVisibility = [...visibility]
      .filter((v) => v.visibleRatio && v.visibleRatio < threshold)
      .sort((a, b) => {
        if (a.visibleRatio !== b.visibleRatio) return a.visibleRatio - b.visibleRatio;

        const aDist = Math.abs(a.col - centerCol);
        const bDist = Math.abs(b.col - centerCol);

        if (aDist !== bDist) return bDist - aDist;

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
  }
}
