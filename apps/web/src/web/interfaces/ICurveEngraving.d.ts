export type BBox = { x: number; y: number; width: number; height: number };
export type Point = [number, number, number | null];
export type Points = Point[][];

export interface MeasureData {
  points: Points;
  gap: [number, number];
  lowest: number; // Lowest measured height, accutally the max measured value
  highest: number; // Highest measured height, accutally the min measured value
  objectHeight: number;
}

export interface CurveEngraving extends MeasureData {
  bbox: BBox;
}
