import { NodeLinkType } from 'app/constants/link-type-constants';

export interface ISVGPathSeg {
  x: number;
  y: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: number;
  pathSegType: number;
  r1?: number,
  r2?: number,
  angle?: number,
  largeArcFlag?: boolean,
  sweepFlag?: boolean,
  toString: () => string;
  _asPathString: () => string;
  clone: () => ISVGPathSeg;
}

export interface ISegment {
  startPoint: IPathNodePoint;
  endPoint: IPathNodePoint;
  next?: ISegment;
  prev?: ISegment;
  type: number;
  index: number;
  item: ISVGPathSeg;
  controlPoints: ISegmentControlPoint[];
  ptgrip: boolean;
  path: ISVGPath;
  select: (isSelected: boolean) => void;
  update: () => void;
  getNodePointAndControlPoints: () => {
    nodePoint: IPathNodePoint, controlPoints: ISegmentControlPoint[]
  } | Record<string, never>;
}

export interface ISegmentControlPoint {
  x: number;
  y: number;
  index: number;
  seg: ISegment;
  nodePoint: IPathNodePoint;
  elem: SVGElement;
  controlPointsLinkType: number;
  isSelected: boolean;
  moveAbs: (x: number, y: number) => any; // Return changes
  hide: () => void;
  show: () => void;
  update: () => void;
  delete: () => any;
  setSelected: (isSelected: boolean) => void;
  move: (dx: number, dy: number) => any;
  moveLinkedControlPoint: () => any;
  removeFromNodePoint: () => void;
}

export interface IPathNodePoint {
  x: number;
  y: number;
  mSeg: ISegment;
  prevSeg?: ISegment;
  nextSeg?: ISegment;
  next: IPathNodePoint | null;
  prev: IPathNodePoint | null;
  path: ISVGPath;
  controlPoints: ISegmentControlPoint[];
  linkType: NodeLinkType;
  isSelected: boolean;
  index: number;
  elem: SVGElement;
  setSelected: (isSelected: boolean) => void;
  getDisplayPosition: () => { x: number, y: number };
  isSharp: () => boolean;
  isRound: () => boolean;
  addControlPoint: (point: ISegmentControlPoint) => void;
  setPrevSeg: (prev: ISegment) => void;
  setMSeg: (prev: ISegment) => void;
  setHighlight: (highlight: boolean) => void;
  update: () => void;
  show: () => void;
  hide: () => void;
  delete: () => void;
  move: (dx: number, dy: number) => any;
  createControlPoints: () => any;
  setNodeType: (type: NodeLinkType) => void;
}

export interface ISVGPath {
  elem: SVGPathElement;
  segs: ISegment[];
  selected_pts: number[];
  selectedPointIndex: number;
  selectedControlPoint?: ISegmentControlPoint;
  nodePoints: IPathNodePoint[];
  first_seg: ISegment;
  matrix: SVGMatrix;
  dragging: number[] | boolean;
  dragctrl: boolean;
  addPtsToSelection: (index: number | number[]) => void;
  addSeg: (index: number, interpolation: number) => void;
  clearSelection: () => void;
  createControlPointsAtGrip: (index: number) => void;
  endChanges: (log: string) => void;
  init: () => ISVGPath;
  removePtFromSelection: (index: number) => void;
  storeD: () => void;
  show: (display: boolean) => ISVGPath;
  update: () => void;
  moveCtrl: (x: number, y: number) => void;
  movePts: (x: number, y: number) => void;
  stripCurveFromSegment: (index: number) => void;
  disconnectNode: (index: number) => number;
  connectNodes: (pt1: number, pt2: number) => number;
}
