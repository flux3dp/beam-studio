// Copyright 2016 Todd Fleming
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
//
// Modified by Dean Sung and Kai Tseng, 2021
//

import { controlConfig } from '@core/app/constants/promark-constants';

const parsedStride = 9;
// per vertex: g, x, y, z, a, t, g0Time, g1Time, s, end
const drawStride = 10;
// per square dot: x, y, z, a, s, time
const dotStride = 6;
// `t` of a lone galvo dot (parseFcode DOT_T / DOT_Y_T): a zero-length record at the dot's
// centre, drawn at a fixed screen size rather than at a length in mm, as a line along x
// (DOT_T) or y (DOT_Y_T) when not drawn square
const DOT_T = 12;
const DOT_Y_T = 13;
const accX = 4000 * 3600; // mm/min^2
const accY = 2000 * 3600; // mm/min^2

export function gcode(drawCommands) {
  const program = drawCommands.compile({
    vert: `
      // highp: positions are bed mm (hundreds) at a dot pitch of 0.05, and where mediump is
      // a real 16-bit float (ANGLE on Metal) a 128-256 mm coordinate only steps by 0.125
      precision highp float;
      uniform mat4 perspective;
      uniform mat4 view;
      uniform float rotaryScale;
      uniform bool isInverting;
      uniform bool showTraversal;
      uniform bool isPrintPass;
      // lone galvo dots (t == 12 along x, 13 along y): drawn dotSize device pixels long;
      // with dotSquare they are left zero-length here and drawn by galvoDots instead
      uniform bool dotSquare;
      uniform float dotSize;
      uniform vec2 viewport;
      attribute vec4 position;
      attribute float g;
      attribute float t;
      attribute float g0Time;
      attribute float g1Time;
      attribute float s;
      // -1 / +1 on the two vertices of a lone dot's record, 0 elsewhere
      attribute float end;
      varying vec4 color;
      varying float vg0Time;
      varying float vg1Time;
      void main() {
        gl_Position = perspective * view * vec4(position.x, position.y + position.a * rotaryScale, position.z, 1);
        bool isDot = (t == 12.0 || t == 13.0) && g != 0.0;
        if(isDot && !dotSquare) {
          // a fixed length in device pixels: offset each end in clip space, scaled by w
          if(t == 13.0) gl_Position.y += end * dotSize / viewport.y * gl_Position.w;
          else gl_Position.x += end * dotSize / viewport.x * gl_Position.w;
        }
        if(g == 0.0) {
          color = showTraversal ? vec4(1.0, 0.0, 0.0, 0.9) : vec4(0.0, 0.0, 0.0, 0.0);
        } else if(t == 1.0)
          color = vec4(0.0, 0.0, 1.0, 1.0);
        else if(t == 2.0)
          color = vec4(0.5, 0.5, 0.0, 1.0);
        else if(t == 3.0)
          color = vec4(1.0, 0.0, 1.0, 1.0);
        else if(t == 4.0)
          color = vec4(0.0, 0.0, 0.0, 1.0);
        else if(t == 5.0)
          color = vec4(0.0, 0.5, 0.7, 1.0);
        else if(t == 6.0 || t == 12.0 || t == 13.0) {
          // raster pixel run or galvo dot: s is 0-255 power, full power = black (white when inverting)
          float k = s / 255.0;
          color = isInverting ? vec4(k, k, k, 1.0) : vec4(1.0 - k, 1.0 - k, 1.0 - k, 1.0);
        }
        else if(t >= 7.0 && t <= 11.0) {
          // 4C printer channel run (see PRINTER_CHANNEL_T in parseFcode), drawn only in
          // the print pass with subtractive blending gl.blendFunc(ZERO, ONE_MINUS_SRC_COLOR):
          // dst *= 1 - k * absorb, so overlapping inks mix like ink (C+M = blue, C+Y = green).
          // s is coverage; the exponent boosts halftone tones to perceived density.
          float k = pow(s / 255.0, 0.5);
          vec3 absorb;
          if(t == 7.0) absorb = vec3(1.0, 0.32, 0.06);       // cyan ink absorbs red
          else if(t == 8.0) absorb = vec3(0.07, 1.0, 0.45);  // magenta absorbs green
          else if(t == 9.0) absorb = vec3(0.0, 0.15, 1.0);   // yellow absorbs blue
          else if(t == 10.0) absorb = vec3(1.0, 1.0, 1.0);   // black absorbs all
          else absorb = vec3(0.10, 0.09, 0.05);              // white ink: faint warm gray hint
          // alpha carries coverage: the print pass blends alpha additively so the
          // framebuffer (cleared to white with alpha 0) becomes visible when composited
          color = vec4(absorb * k, k);
        }
        else if(isInverting)
          color = vec4(1.0, 1.0, 1.0, 1.0);
        else
          color = vec4(0.0, 0.0, 0.0, 1.0);
        // print-channel segments render only in the print pass, everything else only
        // in the normal pass; a zero color is invisible under either blend mode
        bool isPrintSegment = g != 0.0 && t >= 7.0 && t <= 11.0;
        if(isPrintSegment != isPrintPass) color = vec4(0.0, 0.0, 0.0, 0.0);
        vg0Time = g0Time;
        vg1Time = g1Time;
      }`,
    frag: `
      precision mediump float;
      uniform float g0Rate;
      uniform float simTime;
      uniform bool showRemaining;
      varying vec4 color;
      varying float vg0Time;
      varying float vg1Time;
      void main() {
        float time = vg1Time + vg0Time;
        if((time > simTime && !showRemaining) || (time <= simTime && showRemaining))
          discard;
        else
          gl_FragColor = color;
      }`,
    attrs: {
      g: { offset: 0 },
      position: { offset: 4 },
      t: { offset: 20 },
      g0Time: { offset: 24 },
      g1Time: { offset: 28 },
      s: { offset: 32 },
      end: { offset: 36 },
    },
  });
  return ({
    perspective,
    view,
    g0Rate,
    simTime,
    rotaryScale,
    isInverting,
    showTraversal,
    showRemaining,
    dotSize,
    dotSquare,
    viewport,
    data,
    count,
  }) => {
    const { gl } = drawCommands;
    const uniforms = {
      perspective,
      view,
      g0Rate,
      simTime,
      rotaryScale,
      isInverting,
      showTraversal,
      showRemaining,
      dotSize,
      dotSquare,
      viewport,
    };
    const buffer = {
      data,
      stride: drawStride * 4,
      offset: 0,
      count,
    };

    drawCommands.execute({
      program,
      primitive: gl.LINES,
      uniforms: { ...uniforms, isPrintPass: false },
      buffer,
    });

    // 4C printer channel runs: subtractive ink blending on rgb (dst *= 1 - src, the
    // task framebuffer is cleared to white), additive coverage on alpha so the
    // framebuffer's zero-alpha clear becomes opaque where ink lands
    gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE);
    drawCommands.execute({
      program,
      primitive: gl.LINES,
      uniforms: { ...uniforms, isPrintPass: true },
      buffer,
    });
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  };
} // gcode

/**
 * Square dots: one gl.POINTS vertex per galvo dot, from the dot array GcodePreview builds
 * when the square view is first used (lone dots, plus every dot of a multi-dot packed run).
 * Vertex: x, y, z, a (rotary display offset), s (0-255 power), time (sim minutes).
 */
export function galvoDots(drawCommands) {
  const program = drawCommands.compile({
    vert: `
      precision highp float;
      uniform mat4 perspective;
      uniform mat4 view;
      uniform float rotaryScale;
      uniform bool isInverting;
      uniform float dotSize;
      attribute vec4 position;
      attribute float s;
      attribute float time;
      varying vec4 color;
      varying float vtime;
      void main() {
        gl_Position = perspective * view * vec4(position.x, position.y + position.a * rotaryScale, position.z, 1);
        gl_PointSize = dotSize;
        float k = s / 255.0;
        color = isInverting ? vec4(k, k, k, 1.0) : vec4(1.0 - k, 1.0 - k, 1.0 - k, 1.0);
        vtime = time;
      }`,
    frag: `
      precision mediump float;
      uniform float simTime;
      uniform bool showRemaining;
      varying vec4 color;
      varying float vtime;
      void main() {
        if((vtime > simTime && !showRemaining) || (vtime <= simTime && showRemaining))
          discard;
        else
          gl_FragColor = color;
      }`,
    attrs: {
      position: { offset: 0 },
      s: { offset: 16 },
      time: { offset: 20 },
    },
  });
  return ({ perspective, view, rotaryScale, isInverting, simTime, showRemaining, dotSize, data, count }) =>
    drawCommands.execute({
      program,
      primitive: drawCommands.gl.POINTS,
      uniforms: { perspective, view, rotaryScale, isInverting, simTime, showRemaining, dotSize },
      buffer: { data, stride: dotStride * 4, offset: 0, count },
    });
}

export class GcodePreview {
  constructor() {
    this.arrayVersion = 0;
    this.timeInterval = [];
  }

  /**
   * @param rotary fcode rotary/auto-feeder tasks: { axisY, ratio, scaledYFrom }. fluxclient
   *   writes rotary-space y' = axisY + (y - axisY) * ratio — on the A axis (fcode v2) or on Y
   *   itself from record index scaledYFrom (v1). The a slot of the draw array then holds the
   *   offset from the stored y to the design y, so the shader's y + a lands on the canvas
   *   position while the stored y stays machine y for start-here slicing.
   */
  setParsedGcode(parsed, isPromark = false, dpmm = 10, rotaryRatio = 1, rotary = null, galvoRuns = null) {
    // [recordIndex, dotCount] per multi-dot packed run (parseFcode); read by buildDotArray
    this.galvoRuns = galvoRuns;
    this.dotArray = null;
    this.dotArrayVersion = -1;
    // display offset (a slot) for record i with preview-space y and parsed a (NaN = A unset)
    const rotaryOffset = (i, y, a) => {
      if (!rotary) return Number.isNaN(a) ? 0 : a;

      const rotarySpaceY = Number.isNaN(a) ? (i >= rotary.scaledYFrom ? -y : null) : a;
      if (rotarySpaceY === null) return 0;
      const designY = rotary.axisY + (rotarySpaceY - rotary.axisY) / rotary.ratio;
      return -designY - y;
    };

    this.arrayChanged = true;
    this.timeInterval = [];
    this.arrayVersion += 1;
    if (parsed.length < 2 * parsedStride) {
      this.array = null;
      this.g0DistReal = 0;
      this.g0TimeReal = 0;
      this.g1DistReal = 0;
      this.g1TimeReal = 0;
      this.g0Dist = 0;
      this.g0Time = 0;
      this.g1Dist = 0;
      this.g1Time = 0;
    } else {
      const array = new Float32Array(((parsed.length - parsedStride) / parsedStride) * drawStride * 2);
      this.minX = Number.MAX_VALUE;
      this.maxX = -Number.MAX_VALUE;
      this.minY = Number.MAX_VALUE;
      this.maxY = -Number.MAX_VALUE;
      this.minA = Number.MAX_VALUE;
      this.maxA = -Number.MAX_VALUE;

      let g0Dist = 0;
      let g0Time = 0;
      let g1Dist = 0;
      let g1Time = 0;
      let g0DistReal = 0;
      let g0TimeReal = 0;
      let g1DistReal = 0;
      let g1TimeReal = 0;
      let lastFeedrate = 0;
      let lastDirection = 0;
      let lastDottingTime = 0;

      for (let i = 0; i < parsed.length / parsedStride - 1; i += 1) {
        // g
        const x1 = parsed.getItem(i * parsedStride + 1);
        const y1 = parsed.getItem(i * parsedStride + 2);
        const z1 = parsed.getItem(i * parsedStride + 3);
        // e
        // f
        const a1 = parsed.getItem(i * parsedStride + 6);
        // s
        // t

        const g = parsed.getItem(i * parsedStride + 9);
        const x2 = parsed.getItem(i * parsedStride + 10);
        const y2 = parsed.getItem(i * parsedStride + 11);
        const z2 = parsed.getItem(i * parsedStride + 12);
        // e
        const f = parsed.getItem(i * parsedStride + 14);
        const a2 = parsed.getItem(i * parsedStride + 15);

        // segment power: next record's s (raster pixel power, see RASTER_T in parseFcode)
        const s = parsed.getItem(i * parsedStride + 16);
        const t = parsed.getItem(i * parsedStride + 8);
        // minutes the beam dwells on arrival with nothing moving: an inner engraving dot's dotting
        // time (parseGcode) or a galvo dot's LASER_ON period (parseFcode), carried in the
        // otherwise unused e slot. 0 everywhere else.
        const dwell = parsed.getItem(i * parsedStride + 13);

        if (g) {
          this.minX = Math.min(this.minX, x1, x2);
          this.maxX = Math.max(this.maxX, x1, x2);
          this.minY = Math.min(this.minY, y1, y2);
          this.maxY = Math.max(this.maxY, y1, y2);
          this.minA = Math.min(this.minA, a1, a2);
          this.maxA = Math.max(this.maxA, a1, a2);
        }

        const base = i * drawStride * 2;
        // a lone galvo dot's two vertices sit on its centre; the shader spreads them apart
        const isDot = g && (t === DOT_T || t === DOT_Y_T);

        array[base + 0] = g;
        array[base + 1] = x1;
        array[base + 2] = isPromark ? y1 - a1 / rotaryRatio : y1;
        array[base + 3] = z1;
        array[base + 4] = isPromark ? 0 : rotaryOffset(i, y1, a1);
        array[base + 5] = t;
        array[base + 6] = g0Time;
        array[base + 7] = g1Time;
        array[base + 8] = s;
        array[base + 9] = isDot ? -1 : 0;
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (isPromark ? 0 : z2 - z1) ** 2);
        let tc = 0;
        if (isPromark && dwell > 0) {
          // an inner engraving dot: the beam stands still and burns, so its cost is the dwell
          // itself. The jump that placed it is the previous record, costed as a jump below.
          tc = dwell;
        } else if (isPromark) {
          if (z2 !== z1) {
            // Z move
            tc = Math.abs(z2 - z1) / controlConfig.zSpeed / 60;
          } else if (a2 !== a1) {
            // A move
            tc = Math.abs(a2 - a1) / controlConfig.aSpeed / 60000;
          } else if (dist !== 0) {
            // XY move
            if (g === 0) {
              // Jump (No laser)
              tc = dist / controlConfig.travelSpeed / 60 + controlConfig.jumpDelay / 60000000;
            } else if (lastDottingTime > 0) {
              // Jump and pulse (Dotting mode)
              tc =
                dist / controlConfig.travelSpeed / 60 +
                (dist * dpmm * (lastDottingTime + controlConfig.jumpDelay)) / 60000000; // us to min
            } else {
              // Normal mode
              tc = dist / f + controlConfig.laserDelay / 60000000;
            }
          }
          lastDottingTime = t;
        } else if (!Number.isNaN(f) && dist !== 0 && !Number.isNaN(dist)) {
          // A NaN endpoint marks a synthetic break (parseFcode pushBreak), so BOTH
          // touching segments are non-motion: the one arriving at it and the one
          // leaving it. Without the distance check the leaving segment - whose own
          // feedrate is real - yields a NaN time and, worse, a NaN lastFeedrate that
          // poisons every segment after it, taking the whole timeline with it.
          const acc = Math.abs(y2 - y1) > 0 ? accX : accY;
          const direction = Math.atan2(y2 - y1, x2 - x1);
          const lastVel = lastFeedrate * Math.cos(direction - lastDirection);
          const estimateVel =
            lastVel <= 0 ? Math.min(f, (2 * acc * dist) ** 0.5) : Math.min(f, (lastVel ** 2 + 2 * acc * dist) ** 0.5);
          tc = Math.abs(estimateVel - lastVel) / acc + dist / estimateVel;
          lastFeedrate = estimateVel;
          lastDirection = direction;
        } else if (dwell > 0) {
          // a galvo dot (parseFcode): same as the Promark branch above, per dot
          tc = dwell;
        }

        // f = NaN marks synthetic zero-time records (printer swath content, see
        // parseFcode) - not head motion, so they add no distance or time. A dot is the
        // exception: it has no feedrate either, but it does take time.
        const counts = !Number.isNaN(f) || dwell > 0;
        // A dot's drawn width is the display pitch of its grid, not travel: it costs time
        // without covering ground.
        const moved = Number.isNaN(f) ? 0 : dist;

        if (g && counts) {
          g1Time += tc;
          g1Dist += moved;
          g1TimeReal += tc;
          g1DistReal += moved;
        } else if (!g && counts) {
          if (f === 7500) {
            g0Time += tc;
            g0Dist += moved;
          } else {
            g1Time += tc;
            g1Dist += moved;
          }
          g0TimeReal += tc;
          g0DistReal += moved;
        }

        this.timeInterval.push(g1Time + g0Time);

        array[base + drawStride + 0] = g;
        array[base + drawStride + 1] = x2;
        array[base + drawStride + 2] = isPromark ? y2 - a2 / rotaryRatio : y2;
        array[base + drawStride + 3] = z2;
        array[base + drawStride + 4] = isPromark ? 0 : rotaryOffset(i + 1, y2, a2);
        array[base + drawStride + 5] = t;
        array[base + drawStride + 6] = g0Time;
        array[base + drawStride + 7] = g1Time;
        array[base + drawStride + 8] = s;
        array[base + drawStride + 9] = isDot ? 1 : 0;
      }

      this.array = array;
      this.g0Dist = g0Dist;
      this.g0Time = g0Time;
      this.g1Time = g1Time;
      this.g1Dist = g1Dist;
      this.g0DistReal = g0DistReal;
      this.g0TimeReal = g0TimeReal;
      this.g1DistReal = g1DistReal;
      this.g1TimeReal = g1TimeReal;
    }
  }

  /**
   * One vertex per galvo dot for the square view: lone dots as they are, a packed run of n
   * dots spread evenly along its mark (its ends lie half a step past the first and last dot
   * centres), each at the sim time the run reaches it. Built on first use and kept until the
   * records change, since a big raster has millions of dots.
   */
  buildDotArray() {
    if (this.dotArrayVersion === this.arrayVersion) return;
    this.dotArrayVersion = this.arrayVersion;
    this.dotArray = null;
    if (!this.array) return;

    const { array } = this;
    const segments = array.length / (drawStride * 2);
    const runs = this.galvoRuns || [];
    let count = 0;
    let r = 0;
    // size first: runs are sorted by record index, and segment i arrives at record i + 1
    for (let i = 0; i < segments; i += 1) {
      const t = array[i * drawStride * 2 + 5];
      while (r < runs.length && runs[r][0] < i + 1) r += 1;
      if (r < runs.length && runs[r][0] === i + 1) count += runs[r][1];
      else if (array[i * drawStride * 2] && (t === DOT_T || t === DOT_Y_T)) count += 1;
    }
    if (!count) return;

    const dots = new Float32Array(count * dotStride);
    let d = 0;
    r = 0;
    for (let i = 0; i < segments; i += 1) {
      const base = i * drawStride * 2;
      const t = array[base + 5];
      while (r < runs.length && runs[r][0] < i + 1) r += 1;
      const isRun = r < runs.length && runs[r][0] === i + 1;
      if (!isRun && !(array[base] && (t === DOT_T || t === DOT_Y_T))) continue;
      const n = isRun ? runs[r][1] : 1;
      const s = array[base + 8];
      const t1 = array[base + 6] + array[base + 7];
      const t2 = array[base + drawStride + 6] + array[base + drawStride + 7];
      for (let k = 0; k < n; k += 1) {
        const f = (k + 0.5) / n;
        for (let c = 0; c < 4; c += 1) {
          dots[d + c] = array[base + 1 + c] + (array[base + drawStride + 1 + c] - array[base + 1 + c]) * f;
        }
        dots[d + 4] = s;
        dots[d + 5] = t1 + (t2 - t1) * f;
        d += dotStride;
      }
    }
    this.dotArray = dots;
  }

  getSimTimeInfo(simTime) {
    let min = 0;
    let max = this.timeInterval.length;
    let guess;
    let index = -1;
    let position = [0, 0];
    let next = [-1, -1];
    let a = 0;

    while (min <= max) {
      guess = Math.floor((max + min) / 2);

      if (this.timeInterval[guess] < simTime && this.timeInterval[guess + 1] > simTime) {
        index = guess + 1;
        const ratio = (simTime - this.timeInterval[guess]) / (this.timeInterval[index] - this.timeInterval[guess]);
        const ref = index * drawStride * 2;
        const ref2 = ref + drawStride; // second vertex of the segment
        const x = this.array[ref + 1] + (this.array[ref2 + 1] - this.array[ref + 1]) * ratio;
        const y = this.array[ref + 2] + (this.array[ref2 + 2] - this.array[ref + 2]) * ratio;
        // a slot: rotary display offset (0 unless the task spins; promark folds a into y upstream)
        a = this.array[ref + 4] + (this.array[ref2 + 4] - this.array[ref + 4]) * ratio;
        position = [x, -y];
        next = [this.array[ref2 + 1], this.array[ref2 + 2]];
        break;
      } else if (this.timeInterval[guess] < simTime) {
        min = guess + 1;
      } else {
        max = guess - 1;
      }
    }

    return {
      a,
      index,
      position,
      next,
    };
  }

  /**
   * @param dot how lone galvo dots are drawn: { size } device pixels, as a line of that
   *   length or, with { square: true }, a square of that side; viewport is the drawing
   *   buffer's [width, height] in device pixels, which the pixel offsets are scaled by
   */
  draw(
    drawCommands,
    perspective,
    view,
    g0Rate,
    simTime,
    rotaryScale,
    isInverting,
    showTraversal,
    showRemaining,
    dot = { size: 3, square: false },
    viewport = [1, 1],
  ) {
    if (this.drawCommands !== drawCommands) {
      this.drawCommands = drawCommands;
      if (this.buffer) this.buffer.destroy();
      this.buffer = null;
      if (this.dotBuffer) this.dotBuffer.destroy();
      this.dotBuffer = null;
      this.dotBufferVersion = -1;
    }

    if (!this.array) return;

    if (!this.buffer) this.buffer = drawCommands.createBuffer(this.array);
    else if (this.arrayChanged) this.buffer.setData(this.array);
    this.arrayChanged = false;

    drawCommands.gcode({
      perspective,
      view,
      g0Rate,
      simTime,
      rotaryScale,
      isInverting,
      showTraversal,
      showRemaining,
      dotSize: dot.size,
      dotSquare: dot.square,
      viewport,
      data: this.buffer,
      count: this.array.length / drawStride,
    });

    if (!dot.square) return;

    this.buildDotArray();
    if (!this.dotArray) return;

    if (!this.dotBuffer) this.dotBuffer = drawCommands.createBuffer(this.dotArray);
    else if (this.dotBufferVersion !== this.dotArrayVersion) this.dotBuffer.setData(this.dotArray);
    this.dotBufferVersion = this.dotArrayVersion;

    drawCommands.galvoDots({
      perspective,
      view,
      rotaryScale,
      isInverting,
      simTime,
      showRemaining,
      dotSize: dot.size,
      data: this.dotBuffer,
      count: this.dotArray.length / dotStride,
    });
  }
}
