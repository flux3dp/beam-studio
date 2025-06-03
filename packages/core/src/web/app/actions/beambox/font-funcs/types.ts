import type { IBatchCommand } from '@core/interfaces/IHistory';

export const SubstituteResult = {
  CANCEL_OPERATION: 0,
  DO_NOT_SUB: 1,
  DO_SUB: 2,
} as const;
export type SubstituteResultType = (typeof SubstituteResult)[keyof typeof SubstituteResult];

export const ConvertResult = {
  CANCEL_OPERATION: 0,
  CONTINUE: 2,
  UNSUPPORT: 1,
} as const;
export type ConvertResultType = (typeof ConvertResult)[keyof typeof ConvertResult];

export type ConvertToTextPathResult =
  | { command: IBatchCommand; path: SVGPathElement; status: ConvertResultType }
  | { command: null; path: null; status: ConvertResultType };

export type ConvertInfo = null | { d: string; moveElement?: { x: number; y: number }; transform: null | string };
