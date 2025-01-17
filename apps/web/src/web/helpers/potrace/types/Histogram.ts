import Bitmap from './Bitmap';
import utils from '../utils';

const COLOR_DEPTH = 256;
const COLOR_RANGE_END = COLOR_DEPTH - 1;

/**
 * Calculates array index for pair of indexes. We multiple column (x) by 256 and then add row to it,
 * this way `(index(i, j) + 1) === index(i, j + i)` thus we can reuse `index(i, j)` we once calculated
 *
 * Note: this is different from how indexes calculated in {@link Bitmap} class, keep it in mind.
 *
 * @param x
 * @param y
 * @returns {*}
 * @private
 */
function index(x, y) {
  return COLOR_DEPTH * x + y;
}

function normalizeMinMax(levelMin, levelMax) {
  /**
   * Shared parameter normalization for methods 'multilevelThresholding', 'autoThreshold', 'getDominantColor' and 'getStats'
   *
   * @param levelMin
   * @param levelMax
   * @returns {number[]}
   * @private
   */
  levelMin = typeof levelMin === 'number' ? utils.clamp(Math.round(levelMin), 0, COLOR_RANGE_END) : 0;
  levelMax = typeof levelMax === 'number' ? utils.clamp(Math.round(levelMax), 0, COLOR_RANGE_END) : COLOR_RANGE_END;

  if (levelMin > levelMax) {
    throw new Error(`Invalid range "${levelMin}...${levelMax}"`);
  }

  return [levelMin, levelMax];
}

/**
 * 1D Histogram
 *
 * @param {Number|Bitmap|Jimp} imageSource - Image to collect pixel data from. Or integer to create empty histogram for image of specific size
 * @param [mode] Used only for Jimp images. {@link Bitmap} currently can only store 256 values per pixel, so it's assumed that it contains values we are looking for
 * @constructor
 * @protected
 */
function Histogram(imageSource, mode) {
  this.data = null;
  this.pixels = 0;
  this._sortedIndexes = null;
  this._cachedStats = {};
  this._lookupTableH = null;

  if (typeof imageSource === 'number') {
    this._createArray(imageSource);
  } else if (imageSource instanceof Bitmap) {
    this._collectValuesBitmap(imageSource);
  } else if (Jimp && imageSource instanceof Jimp) {
    this._collectValuesJimp(imageSource, mode);
  } else {
    throw new Error('Unsupported image source');
  }
}

Histogram.MODE_LUMINANCE = 'luminance';
Histogram.MODE_R = 'r';
Histogram.MODE_G = 'g';
Histogram.MODE_B = 'b';

Histogram.prototype = {
  /**
   * Initializes data array for an image of given pixel size
   * @param imageSize
   * @returns {Uint8Array|Uint16Array|Uint32Array}
   * @private
   */
  _createArray(imageSize) {
    const ArrayType = imageSize <= Math.pow(2, 8) ? Uint8Array
      : imageSize <= Math.pow(2, 16) ? Uint16Array : Uint32Array;

    this.pixels = imageSize;

    return this.data = new ArrayType(COLOR_DEPTH);
  },

  /**
   * Aggregates color data from {@link Jimp} instance
   * @param {Jimp} source
   * @param mode
   * @private
   */
  _collectValuesJimp(source, mode) {
    const pixelData = source.bitmap.data;
    const data = this._createArray(source.bitmap.width * source.bitmap.height);

    source.scan(0, 0, source.bitmap.width, source.bitmap.height, (x, y, idx) => {
      const val = mode === Histogram.MODE_R ? pixelData[idx]
        : mode === Histogram.MODE_G ? pixelData[idx + 1]
          : mode === Histogram.MODE_B ? pixelData[idx + 2]
            : utils.luminance(pixelData[idx], pixelData[idx + 1], pixelData[idx + 2]);

      data[val]++;
    });
  },

  /**
   * Aggregates color data from {@link Bitmap} instance
   * @param {Bitmap} source
   * @private
   */
  _collectValuesBitmap(source) {
    const data = this._createArray(source.size);
    const len = source.data.length;
    let color;

    for (let i = 0; i < len; i++) {
      color = source.data[i];
      data[color]++;
    }
  },

  /**
   * Returns array of color indexes in ascending order
   * @param refresh
   * @returns {*}
   * @private
   */
  _getSortedIndexes(refresh) {
    if (!refresh && this._sortedIndexes) {
      return this._sortedIndexes;
    }

    const { data } = this;
    const indexes = new Array(COLOR_DEPTH);
    let i = 0;

    for (i; i < COLOR_DEPTH; i++) {
      indexes[i] = i;
    }

    indexes.sort((a, b) => (data[a] > data[b] ? 1 : data[a] < data[b] ? -1 : 0));

    this._sortedIndexes = indexes;
    return indexes;
  },

  /**
   * Builds lookup table H from lookup tables P and S.
   * see {@link http://www.iis.sinica.edu.tw/page/jise/2001/200109_01.pdf|this paper} for more details
   *
   * @returns {Float64Array}
   * @private
   */
  _thresholdingBuildLookupTable() {
    const P = new Float64Array(COLOR_DEPTH * COLOR_DEPTH);
    const S = new Float64Array(COLOR_DEPTH * COLOR_DEPTH);
    const H = new Float64Array(COLOR_DEPTH * COLOR_DEPTH);
    const pixelsTotal = this.pixels;
    let i; let j; let idx; let
      tmp;

    // diagonal
    for (i = 1; i < COLOR_DEPTH; ++i) {
      idx = index(i, i);
      tmp = this.data[i] / pixelsTotal;

      P[idx] = tmp;
      S[idx] = i * tmp;
    }

    // calculate first row (row 0 is all zero)
    for (i = 1; i < COLOR_DEPTH - 1; ++i) {
      tmp = this.data[i + 1] / pixelsTotal;
      idx = index(1, i);

      P[idx + 1] = P[idx] + tmp;
      S[idx + 1] = S[idx] + (i + 1) * tmp;
    }

    // using row 1 to calculate others
    for (i = 2; i < COLOR_DEPTH; i++) {
      for (j = i + 1; j < COLOR_DEPTH; j++) {
        P[index(i, j)] = P[index(1, j)] - P[index(1, i - 1)];
        S[index(i, j)] = S[index(1, j)] - S[index(1, i - 1)];
      }
    }

    // now calculate H[i][j]
    for (i = 1; i < COLOR_DEPTH; ++i) {
      for (j = i + 1; j < COLOR_DEPTH; j++) {
        idx = index(i, j);
        H[idx] = P[idx] !== 0 ? S[idx] * S[idx] / P[idx] : 0;
      }
    }

    return this._lookupTableH = H;
  },

  /**
   * Implements Algorithm For Multilevel Thresholding
   * Receives desired number of color stops, returns array of said size. Could be limited to a range levelMin..levelMax
   *
   * Regardless of levelMin and levelMax values it still relies on between class variances for the entire histogram
   *
   * @param amount - how many thresholds should be calculated
   * @param [levelMin=0] - histogram segment start
   * @param [levelMax=255] - histogram segment end
   * @returns {number[]}
	 */
  multilevelThresholding(amount, levelMin, levelMax) {
    levelMin = normalizeMinMax(levelMin, levelMax);
    levelMax = levelMin[1];
    levelMin = levelMin[0];
    amount = Math.min(levelMax - levelMin - 2, ~~amount);

    if (amount < 1) {
      return [];
    }

    if (!this._lookupTableH) {
      this._thresholdingBuildLookupTable();
    }

    const H = this._lookupTableH;

    let colorStops = null;
    let maxSig = 0;

    if (amount > 4) {
      console.log('[Warning]: Threshold computation for more than 5 levels may take a long time');
    }

    function iterateRecursive(startingPoint, prevVariance, indexes, previousDepth) {
      startingPoint = (startingPoint || 0) + 1;
      prevVariance = prevVariance || 0;
      indexes = indexes || (new Array(amount));
      previousDepth = previousDepth || 0;

      const depth = previousDepth + 1; // t
      let variance;

      for (let i = startingPoint; i < levelMax - amount + previousDepth; i++) {
        variance = prevVariance + H[index(startingPoint, i)];
        indexes[depth - 1] = i;

	      if (depth + 1 < amount + 1) {
          // we need to go deeper
          iterateRecursive(i, variance, indexes, depth);
        } else {
          // enough, we can compare values now
          variance += H[index(i + 1, levelMax)];

          if (maxSig < variance) {
            maxSig = variance;
            colorStops = indexes.slice();
          }
        }
      }
    }

    iterateRecursive(levelMin || 0);

    return colorStops || [];
  },

  /**
   * Automatically finds threshold value using Algorithm For Multilevel Thresholding
   *
   * @param {number} [levelMin]
   * @param {number} [levelMax]
   * @returns {null|number}
   */
  autoThreshold(levelMin, levelMax) {
    const value = this.multilevelThresholding(1, levelMin, levelMax);
    return value.length ? value[0] : null;
  },

  /**
   * Returns dominant color in given range. Returns -1 if not a single color from the range present on the image
   *
   * @param [levelMin=0]
   * @param [levelMax=255]
   * @param [tolerance=1]
   * @returns {number}
   */
  getDominantColor(levelMin, levelMax, tolerance) {
    levelMin = normalizeMinMax(levelMin, levelMax);
    levelMax = levelMin[1];
    levelMin = levelMin[0];
    tolerance = tolerance || 1;

    const colors = this.data;
    let dominantIndex = -1;
    let dominantValue = -1;
    let i; let j; let
      tmp;

    if (levelMin === levelMax) {
      return colors[levelMin] ? levelMin : -1;
    }

    for (i = levelMin; i <= levelMax; i++) {
      tmp = 0;

      for (j = ~~(tolerance / -2); j < tolerance; j++) {
        tmp += utils.between(i + j, 0, COLOR_RANGE_END) ? colors[i + j] : 0;
      }

      const summIsBigger = tmp > dominantValue;
      const summEqualButMainColorIsBigger = dominantValue === tmp && (dominantIndex < 0 || colors[i] > colors[dominantIndex]);

      if (summIsBigger || summEqualButMainColorIsBigger) {
        dominantIndex = i;
        dominantValue = tmp;
      }
    }

    return dominantValue <= 0 ? -1 : dominantIndex;
  },

  /**
   * Returns stats for histogram or its segment.
   *
   * Returned object contains median, mean and standard deviation for pixel values;
   * peak, mean and median number of pixels per level and few other values
   *
   * If no pixels colors from specified range present on the image - most values will be NaN
   *
   * @param {Number} [levelMin=0] - histogram segment start
   * @param {Number} [levelMax=255] - histogram segment end
   * @param {Boolean} [refresh=false] - if cached result can be returned
   * @returns {{levels: {mean: (number|*), median: *, stdDev: number, unique: number}, pixelsPerLevel: {mean: (number|*), median: (number|*), peak: number}, pixels: number}}
   */
  getStats(levelMin, levelMax, refresh) {
    levelMin = normalizeMinMax(levelMin, levelMax);
    levelMax = levelMin[1];
    levelMin = levelMin[0];

    if (!refresh && this._cachedStats[`${levelMin}-${levelMax}`]) {
      return this._cachedStats[`${levelMin}-${levelMax}`];
    }

    const { data } = this;
    const sortedIndexes = this._getSortedIndexes();

    let pixelsTotal = 0;
    let medianValue = null;
    let meanValue;
    let medianPixelIndex;
    let pixelsPerLevelMean;
    let pixelsPerLevelMedian;
    let tmpSumOfDeviations = 0;
    let tmpPixelsIterated = 0;
    let allPixelValuesCombined = 0;
    let i; let tmpPixels; let
      tmpPixelValue;

    let uniqueValues = 0; // counter for levels that's represented by at least one pixel
    let mostPixelsPerLevel = 0;

    // Finding number of pixels and mean

    for (i = levelMin; i <= levelMax; i++) {
      pixelsTotal += data[i];
      allPixelValuesCombined += data[i] * i;

      uniqueValues += data[i] === 0 ? 0 : 1;

      if (mostPixelsPerLevel < data[i]) {
        mostPixelsPerLevel = data[i];
      }
    }

    meanValue = allPixelValuesCombined / pixelsTotal;
    pixelsPerLevelMean = pixelsTotal / (levelMax - levelMin);
    pixelsPerLevelMedian = pixelsTotal / uniqueValues;
    medianPixelIndex = Math.floor(pixelsTotal / 2);

    // Finding median and standard deviation

    for (i = 0; i < COLOR_DEPTH; i++) {
      tmpPixelValue = sortedIndexes[i];
      tmpPixels = data[tmpPixelValue];

      if (tmpPixelValue < levelMin || tmpPixelValue > levelMax) {
        continue;
      }

      tmpPixelsIterated += tmpPixels;
      tmpSumOfDeviations += Math.pow(tmpPixelValue - meanValue, 2) * tmpPixels;

      if (medianValue === null && tmpPixelsIterated >= medianPixelIndex) {
        medianValue = tmpPixelValue;
      }
    }

    return this._cachedStats[`${levelMin}-${levelMax}`] = {
      // various pixel counts for levels (0..255)

      levels: {
        mean: meanValue,
        median: medianValue,
        stdDev: Math.sqrt(tmpSumOfDeviations / pixelsTotal),
        unique: uniqueValues
      },

      // what's visually represented as bars
      pixelsPerLevel: {
        mean: pixelsPerLevelMean,
        median: pixelsPerLevelMedian,
        peak: mostPixelsPerLevel
      },

      pixels: pixelsTotal
    };
  }
};

export default Histogram;
