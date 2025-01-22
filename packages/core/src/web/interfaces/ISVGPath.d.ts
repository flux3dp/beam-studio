import type { NodeLinkType } from '@core/app/constants/link-type-constants';

export interface ISVGPathSeg {
  _asPathString: () => string;
  angle?: number;
  clone: () => ISVGPathSeg;
  largeArcFlag?: boolean;
  pathSegType: number;
  r1?: number;
  r2?: number;
  sweepFlag?: boolean;
  toString: () => string;
  type: number;
  x: number;
  x1: number;
  x2: number;
  y: number;
  y1: number;
  y2: number;
}

export interface ISegment {
  controlPoints: ISegmentControlPoint[];
  endPoint: IPathNodePoint;
  getNodePointAndControlPoints: () =>
    | Record<string, never>
    | {
        controlPoints: ISegmentControlPoint[];
        nodePoint: IPathNodePoint;
      };
  index: number;
  item: ISVGPathSeg;
  next?: ISegment;
  path: ISVGPath;
  prev?: ISegment;
  ptgrip: boolean;
  select: (isSelected: boolean) => void;
  startPoint: IPathNodePoint;
  type: number;
  update: () => void;
}

export interface ISegmentControlPoint {
  controlPointsLinkType: number;
  delete: () => any;
  elem: SVGElement;
  hide: () => void;
  index: number;
  isSelected: boolean;
  move: (dx: number, dy: number) => any;
  moveAbs: (x: number, y: number) => any; // Return changes
  moveLinkedControlPoint: () => any;
  nodePoint: IPathNodePoint;
  removeFromNodePoint: () => void;
  seg: ISegment;
  setSelected: (isSelected: boolean) => void;
  show: () => void;
  update: () => void;
  x: number;
  y: number;
}

export interface IPathNodePoint {
  addControlPoint: (point: ISegmentControlPoint) => void;
  controlPoints: ISegmentControlPoint[];
  createControlPoints: () => any;
  delete: () => void;
  elem: SVGElement;
  getDisplayPosition: () => { x: number; y: number };
  hide: () => void;
  index: number;
  isRound: () => boolean;
  isSelected: boolean;
  isSharp: () => boolean;
  linkType: NodeLinkType;
  move: (dx: number, dy: number) => any;
  mSeg: ISegment;
  next: IPathNodePoint | null;
  nextSeg?: ISegment;
  path: ISVGPath;
  prev: IPathNodePoint | null;
  prevSeg?: ISegment;
  setHighlight: (highlight: boolean) => void;
  setMSeg: (prev: ISegment) => void;
  setNodeType: (type: NodeLinkType) => void;
  setPrevSeg: (prev: ISegment) => void;
  setSelected: (isSelected: boolean) => void;
  show: () => void;
  update: () => void;
  x: number;
  y: number;
}

export interface ISVGPath {
  addPtsToSelection: (index: number | number[]) => void;
  addSeg: (index: number, interpolation: number) => void;
  clearSelection: () => void;
  connectNodes: (pt1: number, pt2: number) => number;
  createControlPointsAtGrip: (index: number) => void;
  disconnectNode: (index: number) => number;
  dragctrl: boolean;
  dragging: boolean | number[];
  elem: SVGPathElement;
  endChanges: (log: string) => void;
  first_seg: ISegment;
  init: () => ISVGPath;
  matrix: SVGMatrix;
  moveCtrl: (x: number, y: number) => void;
  movePts: (x: number, y: number) => void;
  nodePoints: IPathNodePoint[];
  removePtFromSelection: (index: number) => void;
  segs: ISegment[];
  selected_pts: number[];
  selectedControlPoint?: ISegmentControlPoint;
  selectedPointIndex: number;
  show: (display: boolean) => ISVGPath;
  storeD: () => void;
  stripCurveFromSegment: (index: number) => void;
  update: () => void;
}
