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

class ParsedGcode {
  chunks = [[]];

  maxChunkSize = 1000000;

  length = 0;

  push = (item) => {
    const curIndex = this.chunks.length - 1;
    if (this.chunks[curIndex].length < this.maxChunkSize) {
      this.chunks[curIndex].push(item);
    } else {
      this.chunks.push([item]);
    }
    this.length += 1;
  };

  getItem = (index) => {
    const chunkId = Math.floor(index / this.maxChunkSize);
    const i = index % this.maxChunkSize;
    return this.chunks[chunkId][i];
  };

  setItem = (index, item) => {
    const chunkId = Math.floor(index / this.maxChunkSize);
    const i = index % this.maxChunkSize;
    this.chunks[chunkId][i] = item;
  };
}

export function parseGcode(gcode, isPromark = false) {
  const parsedGcode = new ParsedGcode();
  let lastG = NaN,
    lastX = NaN,
    lastY = NaN,
    lastZ = NaN,
    lastA = NaN,
    lastF = NaN,
    lastS = 0,
    lastT = 0;
  let stride = 9;
  let i = 0;
  /*
  let g = NaN, x = NaN, y = NaN, z = NaN, a = NaN, f = NaN;
  for (let i = 0; i < gcodeList.length; ++i) {

  }*/

  let laserEnabled = false;
  let useRelative = false;
  // calculate task time with wobble by decreasing feedrate instead of calculating real moving distance
  let wobbleFactor = 1;

  while (i < gcode.length) {
    function parse() {
      ++i;
      while (i < gcode.length && (gcode[i] === ' ' || gcode[i] === '\t')) ++i;
      let begin = i;
      while (i < gcode.length && '+-.0123456789'.indexOf(gcode[i]) != -1) ++i;
      return Number(gcode.substr(begin, i - begin));
    }
    let g = NaN,
      x = NaN,
      y = NaN,
      z = NaN,
      a = NaN,
      f = NaN;
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
      } else if (gcode[i] === 'A' || gcode[i] === 'a') a = parse();
      else if (gcode[i] === 'F' || gcode[i] === 'f') {
        f = parse() / wobbleFactor;
      } else if (gcode[i] === 'S' || gcode[i] === 's') {
        lastS = parse();
        g = lastS > 0 ? 1 : 0;
      } else if (gcode[i] === 'T' || gcode[i] === 't') lastT = parse();
      else if (gcode[i] === 'M' && gcode[i + 1] === '2') {
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
      } else ++i;
    }
    if (gcode.slice(i, i + 9) === ';WOBBLE K') {
      // For Swiftray GCode
      // ;WOBBLE K[float]\n: Estimated wobble time multiplier
      i += 9;
      wobbleFactor = parse();
    }
    if (g === 0 || g === 1 || !isNaN(x) || !isNaN(y) || !isNaN(z) || !isNaN(a) || !isNaN(f)) {
      if (g === 0 || g === 1) lastG = g;
      if (!isNaN(x)) {
        if (isNaN(lastX)) {
          for (let j = 1; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, x);
          }
        }
        lastX = x;
      }
      if (!isNaN(y)) {
        if (isNaN(lastY)) {
          for (let j = 2; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, y);
          }
        }
        lastY = y;
      }
      if (!isNaN(z)) {
        if (isNaN(lastZ)) {
          for (let j = 3; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, z);
          }
        }
        lastZ = z;
      }
      if (!isNaN(a)) {
        if (isNaN(lastA)) {
          for (let j = 6; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, a);
          }
        }
        lastA = a;
      }
      if (!isNaN(f)) {
        if (isNaN(lastF)) {
          for (let j = 4; j < parsedGcode.length; j += stride) {
            parsedGcode.setItem(j, f);
          }
        }
        lastF = f;
      }
      if (!isNaN(lastG)) {
        parsedGcode.push(lastG || lastS > 0 ? 1 : 0);
        parsedGcode.push(lastX);
        parsedGcode.push(lastY);
        parsedGcode.push(lastZ);
        parsedGcode.push(0); // E
        parsedGcode.push(lastF);
        parsedGcode.push(lastA);
        parsedGcode.push(lastS);
        parsedGcode.push(lastT);
      }
    }
    while (i < gcode.length && gcode[i] !== '\r' && gcode[i] !== '\n') ++i;
    while (i < gcode.length && (gcode[i] === '\r' || gcode[i] === '\n')) ++i;
  }

  if (isNaN(lastX)) {
    for (let j = 1; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }
  if (isNaN(lastY)) {
    for (let j = 2; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }
  if (isNaN(lastZ)) {
    for (let j = 3; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }
  if (isNaN(lastF)) {
    for (let j = 4; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 1000);
    }
  }
  if (isNaN(lastA)) {
    for (let j = 6; j < parsedGcode.length; j += stride) {
      parsedGcode.setItem(j, 0);
    }
  }
  console.log('Parsed GCode', parsedGcode);
  return parsedGcode;
}

export default parseGcode;
