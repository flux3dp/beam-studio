import type { MergeGroup, PieceVisibility } from '../../types';

export interface MergeStrategy {
  calculateMergeGroups(visibility: PieceVisibility[], rows: number, cols: number, threshold: number): MergeGroup[];
}
