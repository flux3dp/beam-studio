import Point from './Point';
import utils from '../utils';

/**
 * Represents a bitmap where each pixel can be a number in range of 0..255
 * Used internally to store luminance data.
 *
 * @param {Number} w
 * @param {Number} h
 * @constructor
 */
function Bitmap(w, h) {
  this._histogram = null;

  this.width = w;
  this.height = h;
  this.size = w * h;
  this.arrayBuffer = new ArrayBuffer(this.size);
  this.data = new Uint8Array(this.arrayBuffer);
}

Bitmap.prototype = {
  /**
   * Returns pixel value
   *
   * @param {Number|Point} x - index, point or x
   * @param {Number} [y]
   */
  getValueAt(x, y) {
    const index = (typeof x === 'number' && typeof y !== 'number') ? x : this.pointToIndex(x, y);
    return this.data[index];
  },

  /**
   * Converts {@link Point} to index value
   *
   * @param {Number} index
   * @returns {Point}
   */
  indexToPoint(index) {
    const point = new Point();

	  if (utils.between(index, 0, this.size)) {
      point.y = Math.floor(index / this.width);
      point.x = index - point.y * this.width;
    } else {
      point.x = -1;
      point.y = -1;
    }

    return point;
  },

  /**
   * Calculates index for point or coordinate pair
   *
   * @param {Number|Point} pointOrX
   * @param {Number} [y]
   * @returns {Number}
   */
  pointToIndex(pointOrX, y) {
    let _x = pointOrX;
    let _y = y;

    if (pointOrX instanceof Point) {
      _x = pointOrX.x;
      _y = pointOrX.y;
    }

    if (!utils.between(_x, 0, this.width) || !utils.between(_y, 0, this.height)) {
      return -1;
    }

    return this.width * _y + _x;
  },

  /**
   * Makes a copy of current bitmap
   *
   * @param {Function} [iterator] optional callback, used for processing pixel value. Accepted arguments: value, index
   * @returns {Bitmap}
   */
  copy(iterator) {
    const bm = new Bitmap(this.width, this.height);
    const iteratorPresent = typeof iterator === 'function';
    let i;

    for (i = 0; i < this.size; i++) {
      bm.data[i] = iteratorPresent ? iterator(this.data[i], i) : this.data[i];
    }

    return bm;
  },

  histogram() {
    if (this._histogram) {
      return this._histogram;
    }

    this._histogram = new Bitmap.Histogram(this);
    return this._histogram;
  }
};

export default Bitmap;
