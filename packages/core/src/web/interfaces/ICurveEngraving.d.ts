export type BBox = { height: number; width: number; x: number; y: number };
export type Point = [number, number, null | number];
export type Points = Point[][];

export interface MeasureData {
  gap: [number, number];
  highest: number; // Highest measured height, accutally the min measured value
  lowest: number; // Lowest measured height, accutally the max measured value
  objectHeight: number;
  points: Points;
}

export interface CurveEngraving extends MeasureData {
  bbox: BBox;
}
