import { ISVGPathSeg } from './ISVGPath';

export interface ISVGPathSegList {
  numberOfItems: number;
  getItem: (index: number) => ISVGPathSeg;
  removeItem: (index: number) => void;
  appendItem: (item: ISVGPathSeg) => void;
  clear: () => void;
}

export default interface ISVGPathElement extends SVGPathElement {
  pathSegList: ISVGPathSegList;
  createSVGPathSegClosePath: () => ISVGPathSeg;
  createSVGPathSegMovetoAbs: (x, y) => ISVGPathSeg;
  createSVGPathSegMovetoRel: (x, y) => ISVGPathSeg;
  createSVGPathSegLinetoAbs: (x, y) => ISVGPathSeg;
  createSVGPathSegLinetoRel: (x, y) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicAbs: (x, y, x1, y1, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicRel: (x, y, x1, y1, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticAbs: (x, y, x1, y1) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticRel: (x, y, x1, y1) => ISVGPathSeg;
  createSVGPathSegArcAbs: (x, y, r1, r2, angle, largeArcFlag, sweepFlag) => ISVGPathSeg;
  createSVGPathSegArcRel: (x, y, r1, r2, angle, largeArcFlag, sweepFlag) => ISVGPathSeg;
  createSVGPathSegLinetoHorizontalAbs: (x) => ISVGPathSeg;
  createSVGPathSegLinetoHorizontalRel: (x) => ISVGPathSeg;
  createSVGPathSegLinetoVerticalAbs: (y) => ISVGPathSeg;
  createSVGPathSegLinetoVerticalRel: (y) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicSmoothAbs: (x, y, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoCubicSmoothRel: (x, y, x2, y2) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticSmoothAbs: (x, y) => ISVGPathSeg;
  createSVGPathSegCurvetoQuadraticSmoothRel: (x, y) => ISVGPathSeg;
}
