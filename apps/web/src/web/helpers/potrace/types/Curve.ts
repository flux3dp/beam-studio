/**
 * Curve type
 *
 * @param n
 * @constructor
 * @protected
 */
class Curve {
  n: number;

  tag: Array<number>;

  c: Array<number>;

  alphaCurve: number;

  vertex: Array<number>;

  alpha: Array<number>;

  alpha0: Array<number>;

  beta: Array<number>;

  constructor(n: number) {
    this.n = n;
    this.tag = new Array(n);
    this.c = new Array(n * 3);
    this.alphaCurve = 0;
    this.vertex = new Array(n);
    this.alpha = new Array(n);
    this.alpha0 = new Array(n);
    this.beta = new Array(n);
  }
}

export default Curve;
