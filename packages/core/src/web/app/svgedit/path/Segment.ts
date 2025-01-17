import {
  IPathNodePoint, ISegment, ISVGPath, ISVGPathSeg,
} from 'interfaces/ISVGPath';
import SegmentControlPoint from './SegmentControlPoint';

const { svgedit } = window;

export default class Segment implements ISegment {
  startPoint: IPathNodePoint;

  endPoint: IPathNodePoint;

  type: number;

  index: number;

  item: ISVGPathSeg;

  controlPoints: SegmentControlPoint[];

  ptgrip: boolean;

  path: ISVGPath;

  next?: Segment;

  prev?: Segment;

  mate?: Segment;

  constructor(index: number, item: ISVGPathSeg) {
    this.index = index;
    this.item = item;
    this.type = item.pathSegType;
    this.controlPoints = [];
  }

  select(isSelected: boolean): void {
    this.endPoint.setSelected(isSelected);
  }

  update(): void {
    if (this.ptgrip) {
      const pt = svgedit.path.getGripPt(this);
      svgedit.utilities.assignAttributes(this.ptgrip, {
        cx: pt.x,
        cy: pt.y,
      });

      svgedit.path.getSegSelector(this, true);
    }
  }

  getNodePointAndControlPoints(): {
    nodePoint: IPathNodePoint,
    controlPoints: SegmentControlPoint[]
  } | Record<string, never> {
    const pathSeg = this.item;
    if (pathSeg.pathSegType === 1) {
      return {};
    }
    const nodePoint = new svgedit.path.PathNodePoint(pathSeg.x, pathSeg.y, this, this.path);
    const controlPoints = [];
    if (pathSeg.pathSegType === 6) {
      controlPoints.push(new SegmentControlPoint(pathSeg.x1, pathSeg.y1, this, 1));
      controlPoints.push(new SegmentControlPoint(pathSeg.x2, pathSeg.y2, this, 2));
    } else if (pathSeg.pathSegType === 8) {
      controlPoints.push(new SegmentControlPoint(pathSeg.x1, pathSeg.y1, this, 1));
    }
    this.controlPoints = controlPoints;
    return { nodePoint, controlPoints };
  }
}
