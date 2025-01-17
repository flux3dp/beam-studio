import Potrace from './Potrace';
import Posterizer from './Posterizer';

/**
 * Wrapper for Potrace that simplifies use down to one function call
 *
 * @param {string|Buffer|Jimp} file Source image, file path or {@link Jimp} instance
 * @param {PotraceOptions} [options]
 * @param {traceCallback} cb Callback function. Accepts 3 arguments: error, svg content and instance of {@link Potrace}
 */
const trace = async (file, options): Promise<string> => {
  const potrace = new Potrace(options);
  await potrace.loadImage(file);
  const svg = potrace.getSVG();
  return svg;
};

const posterize = async (file, options): Promise<string> => {
  const potrace = new Posterizer(options);
  await potrace.loadImage(file);
  const svg = potrace.getSVG();
  return svg;
};

export { trace, posterize };
