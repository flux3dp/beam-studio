export type BBox = { height: number; width: number; x: number; y: number };
export type Point = [number, number, null | number];
export type Points = Point[][];

// same dimensions as Points, but with string error messages
export type Errors = Array<Array<null | string>>;

export interface MeasureData {
  errors: Errors;
  gap: [number, number];
  highest: null | number; // Highest measured height, accutally the min measured value, null if no value
  lowest: null | number; // Lowest measured height, accutally the max measured value, null if no value
  objectHeight: number;
  points: Points;
}

export interface CurveEngraving extends MeasureData {
  bbox: BBox;
}
