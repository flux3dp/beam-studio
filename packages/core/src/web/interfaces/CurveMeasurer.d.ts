import { MeasureData } from './ICurveEngraving';

export interface InteractiveOptions {
  checkCancel?: () => boolean;
  onProgressText?: (text: string) => void;
  onPointFinished?: (finishedCount: number) => void;
}

export interface CurveMeasurer {
  setupDevice: () => Promise<boolean>;
  setup: (onProgressText?: (text: string) => void) => Promise<boolean>;
  end: () => Promise<void>;
  measurePoint: (
    x: number,
    y: number,
    feedrate: number,
    offset?: [number, number, number],
    objectHeight?: number,
    lowest?: number
  ) => Promise<number | null>;
  measurePoints: (
    curData: MeasureData,
    targetIndices: Array<number>,
    opts?: InteractiveOptions
  ) => Promise<MeasureData | null>;
  measureArea: (
    xRange: Array<number>,
    yRange: Array<number>,
    objectHeight: number,
    opts?: InteractiveOptions
  ) => Promise<MeasureData | null>;
}
