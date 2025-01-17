/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */

export const generateCursorSvg = (brushSize: number): string => {
  const strokeWidth = (() => {
    if (brushSize <= 10) {
      return 2;
    }
    if (brushSize <= 20) {
      return 1;
    }
    if (brushSize <= 40) {
      return 0.4;
    }
    if (brushSize <= 80) {
      return 0.2;
    }
    return 0.1;
  })();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#1890FF" stroke-opacity="1"
    stroke-width="${strokeWidth}"
    width="${brushSize}"
    height="${brushSize}"
    viewBox="0 0 10 10"
    >
      <circle cx="50%" cy="50%" r="${5 - strokeWidth / 2}"/>
    </svg>`;

  return encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
};
