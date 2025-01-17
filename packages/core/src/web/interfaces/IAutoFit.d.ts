export interface AutoFit {
  angle: number;
  bbox: number[];
  center: number[];
}

export interface AutoFitContour extends AutoFit {
  contour: Array<[number, number]>;
}
