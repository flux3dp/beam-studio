// Copyright 2014, 2016, 2017 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

export class ParsedGcode {
  chunks: number[][] = [[]];

  maxChunkSize = 1000000;

  length = 0;

  push = (item: number): void => {
    const curIndex = this.chunks.length - 1;

    if (this.chunks[curIndex].length < this.maxChunkSize) {
      this.chunks[curIndex].push(item);
    } else {
      this.chunks.push([item]);
    }

    this.length += 1;
  };

  getItem = (index: number): number => {
    const chunkId = Math.floor(index / this.maxChunkSize);
    const i = index % this.maxChunkSize;

    return this.chunks[chunkId][i];
  };

  setItem = (index: number, item: number): void => {
    const chunkId = Math.floor(index / this.maxChunkSize);
    const i = index % this.maxChunkSize;

    this.chunks[chunkId][i] = item;
  };
}

/**
 * Drawn size of one inner engraving dot when the spacing to its neighbour gives no better answer,
 * and the range an inferred spacing is trusted within. A dot has no size in the gcode: it is a
 * point of deposited energy, so it is drawn at the pitch of the grid it belongs to (the layer's
 * point spacing, read off the distance to the previous dot). Same idea as the galvo dots in
 * parseFcode.
 */
const DOT_MM = 0.1;
const DOT_MIN_MM = 0.02;
const DOT_MAX_MM = 0.5;
/** Sim time is kept in minutes, and the dotting time (T) arrives in microseconds. */
const US_TO_MIN = 1 / 60000000;

export function parseGcode(gcode: string, isPromark = false): ParsedGcode {
  const parsedGcode = new ParsedGcode();
  let lastG = Number.NaN,
    lastX = Number.NaN,
    lastY = Number.NaN,
    lastZ = Number.NaN,
    lastA = Number.NaN,
    lastF = Number.NaN,
    lastS = 0,
    lastT = 0;
  let stride = 9;
  let i = 0;
  let laserEnabled = false;
  let useRelative = false;
  // calculate task time with wobble by decreasing feedrate instead of calculating real moving distance
  let wobbleFactor = 1;
  // Inner engraving (";CONFIG INNER_ENGRAVING=1", written by Swiftray for a 3D document): while the
  // dotting time T is set, every laser-on move is one dot fired on arrival, not a line. Swiftray
  // writes the same gcode for the preview and the job, so the dots are drawn here: a travel record
  // to the dot (the jump, red) and a feedrate-less mark one pitch wide that carries the dotting
  // time as its dwell (the e slot, see GcodePreview). 2D Promark gcode is left alone.
  let innerEngraving = false;
  let dotPitch = DOT_MM;
  let lastDotX = Number.NaN;
  let lastDotY = Number.NaN;

  const pushRecord = (
    g: number,
    x: number,
    y: number,
    z: number,
    e: number,
    f: number,
    a: number,
    s: number,
    t: number,
  ) => {
    parsedGcode.push(g);
    parsedGcode.push(x);
    parsedGcode.push(y);
    parsedGcode.push(z);
    parsedGcode.push(e);
    parsedGcode.push(f);
    parsedGcode.push(a);
    parsedGcode.push(s);
    parsedGcode.push(t);
  };

  while (i < gcode.length) {
    function parse() {
      ++i;
      while (i < gcode.length && (gcode[i] === ' ' || gcode[i] === '\t')) ++i;

      let begin = i;

      while (i < gcode.length && '+-.0123456789'.includes(gcode[i])) ++i;

      return Number(gcode.substr(begin, i - begin));
    }

    let g = Number.NaN,
      x = Number.NaN,
      y = Number.NaN,
      z = Number.NaN,
      a = Number.NaN,
      f = Number.NaN;
    let powerSet = false;

    while (i < gcode.length && gcode[i] !== ';' && gcode[i] !== '\r' && gcode[i] !== '\n') {
      if (gcode[i] === 'G' || gcode[i] === 'g') {
        if (gcode[i + 2] === 'S') {
          laserEnabled = false; // Specialized for FLUXGhost/Client GCode G1S0
          i += 3;
        } else if (gcode[i + 2] === 'V') {
          laserEnabled = true; // Specialized for FLUXGhost/Client GCode G1V0
          i += 3;
        } else {
          const gCmd = parse();

          if (gCmd === 90) {
            useRelative = false;
          } else if (gCmd === 91) {
            useRelative = true;
          }
        }

        g = laserEnabled ? 1 : 0;
      } else if (gcode[i] === 'X' || gcode[i] === 'x') {
        x = useRelative ? lastX + parse() : parse();
      } else if (gcode[i] === 'Y' || gcode[i] === 'y') {
        y = useRelative ? lastY - parse() : -1 * parse();
      } else if (gcode[i] === 'Z' || gcode[i] === 'z') {
        z = parse();

        if (isPromark) z = lastZ + z;
      } else if (gcode[i] === 'A' || gcode[i] === 'a') {
        a = parse();
      } else if (gcode[i] === 'F' || gcode[i] === 'f') {
        f = parse() / wobbleFactor;
      } else if (gcode[i] === 'S' || gcode[i] === 's') {
        lastS = parse();
        g = lastS > 0 ? 1 : 0;
        powerSet = true;
      } else if (gcode[i] === 'T' || gcode[i] === 't') {
        lastT = parse();
      } else if (gcode[i] === 'M' && gcode[i + 1] === '2') {
        // For Swiftray GCode
        // M2: End of program
        g = 0;
        lastS = 0;
        i += 3;
      } else if (gcode[i] === '$' && gcode[i + 1] === 'H') {
        // For Swiftray GCode
        // $H: Home
        x = 0;
        y = 0;
        z = 0;
        i += 3;
      } else {
        ++i;
      }
    }

    if (gcode.slice(i, i + 9) === ';WOBBLE K') {
      // For Swiftray GCode
      // ;WOBBLE K[float]\n: Estimated wobble time multiplier
      i += 9;
      wobbleFactor = parse();
    } else if (gcode.slice(i, i + 25) === ';CONFIG INNER_ENGRAVING=1') {
      innerEngraving = true;
    }

    if (
      g === 0 ||
      g === 1 ||
      !Number.isNaN(x) ||
      !Number.isNaN(y) ||
      !Number.isNaN(z) ||
      !Number.isNaN(a) ||
      !Number.isNaN(f)
    ) {
      if (g === 0 || g === 1) lastG = g;

      if (!Number.isNaN(x)) {
        if (Number.isNaN(lastX)) {
          for (let j = 1; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, x);
          }
        }

        lastX = x;
      }

      if (!Number.isNaN(y)) {
        if (Number.isNaN(lastY)) {
          for (let j = 2; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, y);
          }
        }

        lastY = y;
      }

      if (!Number.isNaN(z)) {
        if (Number.isNaN(lastZ)) {
          for (let j = 3; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, z);
          }
        }

        lastZ = z;
      }

      if (!Number.isNaN(a)) {
        if (Number.isNaN(lastA)) {
          for (let j = 6; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, a);
          }
        }

        lastA = a;
      }

      if (!Number.isNaN(f)) {
        if (Number.isNaN(lastF)) {
          // f is slot 5 (slot 4 is e, the dwell): the records before the first F take its value
          for (let j = 5; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, f);
          }
        }

        lastF = f;
      }

      const isDot =
        isPromark &&
        innerEngraving &&
        lastT > 0 &&
        lastS > 0 &&
        Number.isNaN(z) &&
        Number.isNaN(a) &&
        (!Number.isNaN(x) || !Number.isNaN(y) || powerSet);

      if (isDot) {
        // the pitch comes from the grid the dots sit on; the default only covers the first dot
        if (!Number.isNaN(lastDotX)) {
          const gap = Math.hypot(lastX - lastDotX, lastY - lastDotY);

          if (gap >= DOT_MIN_MM && gap <= DOT_MAX_MM) dotPitch = gap;
        }

        lastDotX = lastX;
        lastDotY = lastY;

        const half = dotPitch / 2;

        // the jump to the dot (g=0 on arrival: drawn as traversal), then the dot itself
        pushRecord(0, lastX - half, lastY, lastZ, 0, lastF, lastA, 0, lastT);
        pushRecord(1, lastX + half, lastY, lastZ, lastT * US_TO_MIN, Number.NaN, lastA, lastS, lastT);
      } else if (!Number.isNaN(lastG)) {
        pushRecord(lastG || lastS > 0 ? 1 : 0, lastX, lastY, lastZ, 0, lastF, lastA, lastS, lastT);
      }
    }

    while (i < gcode.length && gcode[i] !== '\r' && gcode[i] !== '\n') ++i;
    while (i < gcode.length && (gcode[i] === '\r' || gcode[i] === '\n')) ++i;
  }

  if (Number.isNaN(lastX)) {
    for (let j = 1; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }

  if (Number.isNaN(lastY)) {
    for (let j = 2; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }

  if (Number.isNaN(lastZ)) {
    for (let j = 3; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }

  if (Number.isNaN(lastF)) {
    for (let j = 5; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 1000);
    }
  }

  if (Number.isNaN(lastA)) {
    for (let j = 6; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }

  console.log('Parsed GCode', parsedGcode);

  return parsedGcode;
}

export default parseGcode;
