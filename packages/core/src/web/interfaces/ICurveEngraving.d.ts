export type BBox = { height: number; width: number; x: number; y: number };
/**
 * [x, y, z, xOffset?, yOffset?]
 */
export type Point = [number, number, null | number, number?, number?];
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
  subdividedPoints?: Array<[number, number, number]>; // [x, y, z]
}

export interface CurveEngraving extends MeasureData {
  bbox: BBox;
}
