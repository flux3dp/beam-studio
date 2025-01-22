import type { ISVGPathSeg } from './ISVGPath';

export interface ISVGPathSegList {
  appendItem: (item: ISVGPathSeg) => void;
  clear: () => void;
  getItem: (index: number) => ISVGPathSeg;
  numberOfItems: number;
  removeItem: (index: number) => void;
}

export default interface ISVGPathElement extends SVGPathElement {
  createSVGPathSegArcAbs: (x, y, r1, r2, angle, largeArcFlag, sweepFlag) => ISVGPathSeg;
  createSVGPathSegArcRel: (x, y, r1, r2, angle, largeArcFlag, sweepFlag) => ISVGPathSeg;
  createSVGPathSegClosePath: () => ISVGPathSeg;
  createSVGPathSegCurvetoCubicAbs: (x, y, x1, y1, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicRel: (x, y, x1, y1, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicSmoothAbs: (x, y, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicSmoothRel: (x, y, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticAbs: (x, y, x1, y1) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticRel: (x, y, x1, y1) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticSmoothAbs: (x, y) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticSmoothRel: (x, y) => ISVGPathSeg;
  createSVGPathSegLinetoAbs: (x, y) => ISVGPathSeg;
  createSVGPathSegLinetoHorizontalAbs: (x) => ISVGPathSeg;
  createSVGPathSegLinetoHorizontalRel: (x) => ISVGPathSeg;
  createSVGPathSegLinetoRel: (x, y) => ISVGPathSeg;
  createSVGPathSegLinetoVerticalAbs: (y) => ISVGPathSeg;
  createSVGPathSegLinetoVerticalRel: (y) => ISVGPathSeg;
  createSVGPathSegMovetoAbs: (x, y) => ISVGPathSeg;
  createSVGPathSegMovetoRel: (x, y) => ISVGPathSeg;
  pathSegList: ISVGPathSegList;
}
