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
const drawStride = 9;
const accX = 4000 * 3600; // mm/min^2
const accY = 2000 * 3600; // mm/min^2

export function gcode(drawCommands) {
  const program = drawCommands.compile({
    vert: `
      precision mediump float;
      uniform mat4 perspective;
      uniform mat4 view;
      uniform float rotaryScale;
      uniform bool isInverting;
      uniform bool showTraversal;
      uniform bool isPrintPass;
      attribute vec4 position;
      attribute float g;
      attribute float t;
      attribute float g0Time;
      attribute float g1Time;
      attribute float s;
      varying vec4 color;
      varying float vg0Time;
      varying float vg1Time;
      void main() {
        gl_Position = perspective * view * vec4(position.x, position.y + position.a * rotaryScale, position.z, 1);
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
        else if(t == 6.0) {
          // raster pixel run: s is 0-255 power, full power = black (white when inverting)
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
    },
  });
  return ({
    perspective,
    view,
    g0Rate,
    simTime,
    rotaryDiameter,
    isInverting,
    showTraversal,
    showRemaining,
    data,
    count,
  }) => {
    const { gl } = drawCommands;
    const uniforms = {
      perspective,
      view,
      g0Rate,
      simTime,
      rotaryScale: rotaryDiameter * (Math.PI / 360),
      isInverting,
      showTraversal,
      showRemaining,
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

export class GcodePreview {
  constructor() {
    this.arrayVersion = 0;
    this.timeInterval = [];
  }

  setParsedGcode(parsed, isPromark = false, dpmm = 10, rotaryRatio = 1) {
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
      const array = new Float32Array(
        ((parsed.length - parsedStride) / parsedStride) * drawStride * 2,
      );
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

        if (g) {
          this.minX = Math.min(this.minX, x1, x2);
          this.maxX = Math.max(this.maxX, x1, x2);
          this.minY = Math.min(this.minY, y1, y2);
          this.maxY = Math.max(this.maxY, y1, y2);
          this.minA = Math.min(this.minA, a1, a2);
          this.maxA = Math.max(this.maxA, a1, a2);
        }

        array[i * drawStride * 2 + 0] = g;
        array[i * drawStride * 2 + 1] = x1;
        array[i * drawStride * 2 + 2] = isPromark ? y1 - a1 / rotaryRatio : y1;
        array[i * drawStride * 2 + 3] = z1;
        array[i * drawStride * 2 + 4] = isPromark ? 0 : a1;
        array[i * drawStride * 2 + 5] = t;
        array[i * drawStride * 2 + 6] = g0Time;
        array[i * drawStride * 2 + 7] = g1Time;
        array[i * drawStride * 2 + 8] = s;
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (isPromark ? 0 : z2 - z1) ** 2);
        let tc = 0;
        if (isPromark) {
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
        } else if (!Number.isNaN(f) && dist !== 0) {
          const acc = Math.abs(y2 - y1) > 0 ? accX : accY;
          const direction = Math.atan2(y2 - y1, x2 - x1);
          const lastVel = lastFeedrate * Math.cos(direction - lastDirection);
          const estimateVel =
            lastVel <= 0
              ? Math.min(f, (2 * acc * dist) ** 0.5)
              : Math.min(f, (lastVel ** 2 + 2 * acc * dist) ** 0.5);
          tc = Math.abs(estimateVel - lastVel) / acc + dist / estimateVel;
          lastFeedrate = estimateVel;
          lastDirection = direction;
        }

        // f = NaN marks synthetic zero-time records (printer swath content, see
        // parseFcode) - not head motion, so they add no distance or time
        if (g && !Number.isNaN(f)) {
          g1Time += tc;
          g1Dist += dist;
          g1TimeReal += tc;
          g1DistReal += dist;
        } else if (!g && !Number.isNaN(f)) {
          if (f === 7500) {
            g0Time += tc;
            g0Dist += dist;
          } else {
            g1Time += tc;
            g1Dist += dist;
          }
          g0TimeReal += tc;
          g0DistReal += dist;
        }

        this.timeInterval.push(g1Time + g0Time);

        array[i * drawStride * 2 + 9] = g;
        array[i * drawStride * 2 + 10] = x2;
        array[i * drawStride * 2 + 11] = isPromark ? y2 - a2 / rotaryRatio : y2;
        array[i * drawStride * 2 + 12] = z2;
        array[i * drawStride * 2 + 13] = isPromark ? 0 : a2;
        array[i * drawStride * 2 + 14] = t;
        array[i * drawStride * 2 + 15] = g0Time;
        array[i * drawStride * 2 + 16] = g1Time;
        array[i * drawStride * 2 + 17] = s;
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

  getSimTimeInfo(simTime) {
    let min = 0;
    let max = this.timeInterval.length;
    let guess;
    let index = -1;
    let position = [0, 0];
    let next = [-1, -1];

    while (min <= max) {
      guess = Math.floor((max + min) / 2);

      if (this.timeInterval[guess] < simTime && this.timeInterval[guess + 1] > simTime) {
        index = guess + 1;
        const ratio =
          (simTime - this.timeInterval[guess]) /
          (this.timeInterval[index] - this.timeInterval[guess]);
        const ref = index * drawStride * 2;
        const ref2 = ref + drawStride; // second vertex of the segment
        const x = this.array[ref + 1] + (this.array[ref2 + 1] - this.array[ref + 1]) * ratio;
        const y = this.array[ref + 2] + (this.array[ref2 + 2] - this.array[ref + 2]) * ratio;
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
      index,
      position,
      next,
    };
  }

  draw(
    drawCommands,
    perspective,
    view,
    g0Rate,
    simTime,
    rotaryDiameter,
    isInverting,
    showTraversal,
    showRemaining,
  ) {
    if (this.drawCommands !== drawCommands) {
      this.drawCommands = drawCommands;
      if (this.buffer) this.buffer.destroy();
      this.buffer = null;
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
      rotaryDiameter,
      isInverting,
      showTraversal,
      showRemaining,
      data: this.buffer,
      count: this.array.length / drawStride,
    });
  }
}
