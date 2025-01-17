/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable import/prefer-default-export */

interface TargetPointInfo {
  x: number;
  y: number;
  tolerance: number;
}

export const getMagicWandFilter = (
  imageData: ImageData,
  { x, y, tolerance }: TargetPointInfo
): ((imageData: ImageData) => void) => {
  const getFilteredPoints = (x: number, y: number, imageData: ImageData) => {
    const points = Array.of<number>();
    const { width, height, data } = imageData;
    const idx = (y * width + x) * 4;
    const targetR = data[idx];
    const targetG = data[idx + 1];
    const targetB = data[idx + 2];
    // use squared tolerance to avoid square root
    const toleranceSquared = tolerance * tolerance;

    const bfs = (x: number, y: number) => {
      const queue = [y * width + x];
      // store 8 pixels in each Byte, to reduce memory usage
      const visited = new Uint8Array(Math.ceil((width * height) / 8));
      const isVisited = (pos: number) => (visited[pos >> 3] & (1 << pos % 8)) !== 0;
      const markVisited = (pos: number) => {
        visited[pos >> 3] |= 1 << pos % 8;
      };

      markVisited(y * width + x);

      while (queue.length) {
        const pos = queue.pop();
        const x = pos % width;
        const y = (pos / width) >> 0;
        const idx = pos * 4;
        const r = targetR - data[idx];
        const g = targetG - data[idx + 1];
        const b = targetB - data[idx + 2];
        const diffSquared = r * r + g * g + b * b;

        if (diffSquared > toleranceSquared) {
          continue;
        }

        points.push(idx + 3);

        // if statement for performance
        if (x > 0 && !isVisited(pos - 1)) {
          markVisited(pos - 1);
          queue.push(pos - 1);
        }
        if (x < width - 1 && !isVisited(pos + 1)) {
          markVisited(pos + 1);
          queue.push(pos + 1);
        }
        if (y > 0 && !isVisited(pos - width)) {
          markVisited(pos - width);
          queue.push(pos - width);
        }
        if (y < height - 1 && !isVisited(pos + width)) {
          markVisited(pos + width);
          queue.push(pos + width);
        }
      }
    };

    bfs(x, y);

    return points;
  };
  // for loop operation, x and y should be integer
  const points = getFilteredPoints(x >> 0, y >> 0, imageData);

  return ({ data }: ImageData) => {
    for (let i = 0; i < points.length; i++) {
      data[points[i]] = 0;
    }
  };
};
