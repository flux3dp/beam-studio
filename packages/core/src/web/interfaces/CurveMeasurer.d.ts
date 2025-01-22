import type { MeasureData } from './ICurveEngraving';

export interface InteractiveOptions {
  checkCancel?: () => boolean;
  onPointFinished?: (finishedCount: number) => void;
  onProgressText?: (text: string) => void;
}

export interface CurveMeasurer {
  end: () => Promise<void>;
  measureArea: (
    xRange: number[],
    yRange: number[],
    objectHeight: number,
    opts?: InteractiveOptions,
  ) => Promise<MeasureData | null>;
  measurePoint: (
    x: number,
    y: number,
    feedrate: number,
    offset?: [number, number, number],
    objectHeight?: number,
    lowest?: number,
  ) => Promise<null | number>;
  measurePoints: (
    curData: MeasureData,
    targetIndices: number[],
    opts?: InteractiveOptions,
  ) => Promise<MeasureData | null>;
  setup: (onProgressText?: (text: string) => void) => Promise<boolean>;
  setupDevice: () => Promise<boolean>;
}
