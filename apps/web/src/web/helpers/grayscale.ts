/**
 * grayscale
 */
export default function (data, opts) {
  opts = opts || {};
  opts.threshold = (typeof opts.threshold === 'number' ? opts.threshold : 128);
  opts.is_shading = (typeof opts.is_shading === 'boolean' ? opts.is_shading : true);
  opts.is_binary = (typeof opts.is_binary === 'boolean' ? opts.is_binary : false);
  const binary = new Uint8Array(data.length);
  const WHITE = 255;
  const BLACK = 0;

  for (let i = 0; i < data.length; i += 4) {
    const getGrayScale = (alpha, r, g, b) => (1 - alpha) * WHITE + alpha * Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    // http://yolijn.com/convert-rgba-to-rgb
    const alpha = data[i + 3] / 255;
    // refers to http://en.wikipedia.org/wiki/Grayscale
    let grayscale = getGrayScale(alpha, data[i], data[i + 1], data[i + 2]);

    if (opts.is_binary) {
      binary[i] = grayscale > opts.threshold ? 255 : 0;
      binary[i + 1] = grayscale > opts.threshold ? 255 : 0;
      binary[i + 2] = grayscale > opts.threshold ? 255 : 0;
      binary[i + 3] = 255;
    } else {
      // is shading?
      if (!opts.is_shading && opts.threshold > grayscale) {
        grayscale = BLACK;
      }

      grayscale = (opts.threshold > grayscale ? grayscale : WHITE);

      binary[i] = grayscale;
      binary[i + 1] = grayscale;
      binary[i + 2] = grayscale;
      binary[i + 3] = WHITE === grayscale ? 0 : data[i + 3];
    }
  }

  return binary;
}
