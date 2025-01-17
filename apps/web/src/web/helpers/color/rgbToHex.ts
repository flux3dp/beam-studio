/**
 * get hex color string of rgb string
 * @param rgbStr rgb string starting with rgb(
 * @returns
 */
const rgbToHex = (rgbStr: string): string => {
  const rgb = rgbStr.substring(4).split(',');
  let hex = (
    Math.round(parseFloat(rgb[0]) * 2.55) * 65536 +
    Math.round(parseFloat(rgb[1]) * 2.55) * 256 +
    Math.round(parseFloat(rgb[2]) * 2.55)
  ).toString(16);
  if (hex === 'NaN') {
    hex = '0';
  }
  while (hex.length < 6) {
    hex = `0${hex}`;
  }
  return `#${hex.toUpperCase()}`; // ex: #0A23C5
};

export default rgbToHex;
