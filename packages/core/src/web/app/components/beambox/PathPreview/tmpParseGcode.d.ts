export class ParsedGcode {
  chunks: number[][];
  length: number;
  getItem(index: number): number;
  push(item: number): void;
  setItem(index: number, item: number): void;
}

export function parseGcode(gcode: string, isPromark?: boolean): ParsedGcode;

export default parseGcode;
