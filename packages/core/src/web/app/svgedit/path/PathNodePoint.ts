import type { NodeLinkType } from '@core/app/constants/link-type-constants';
import { LINKTYPE_CORNER, LINKTYPE_SMOOTH } from '@core/app/constants/link-type-constants';
import workareaManager from '@core/app/svgedit/workarea';
import type { IPathNodePoint, ISegmentControlPoint, ISVGPath } from '@core/interfaces/ISVGPath';

import type Segment from './Segment';
import SegmentControlPoint from './SegmentControlPoint';

const { svgedit } = window;
const { NS } = svgedit;
const GRIP_SIZE = navigator.maxTouchPoints > 0 ? 8 : 6;

export default class PathNodePoint implements IPathNodePoint {
  x: number;

  y: number;

  mSeg: Segment;

  prevSeg?: Segment;

  nextSeg?: Segment;

  next: null | PathNodePoint;

  prev: null | PathNodePoint;

  path: ISVGPath;

  controlPoints: ISegmentControlPoint[];

  linkType: NodeLinkType;

  isSelected: boolean;

  index: number;

  elem: SVGElement;

  constructor(x: number, y: number, seg: Segment, path: ISVGPath) {
    this.x = x;
    this.y = y;
    this.mSeg = null; // M segment
    this.prevSeg = null;

    if (seg.type === 2) {
      this.setMSeg(seg);
    } else {
      this.setPrevSeg(seg);
    }

    this.nextSeg = null;
    this.next = null; // next connecting grip
    this.prev = null; // previous connecting grip
    this.path = path;
    this.controlPoints = [];
    this.linkType = LINKTYPE_CORNER;
  }

  setMSeg(seg: Segment): void {
    this.mSeg = seg;
  }

  setPrevSeg(seg: Segment): void {
    this.prevSeg = seg;
  }

  addControlPoint(cp: ISegmentControlPoint): void {
    cp.nodePoint = this;
    this.controlPoints.push(cp);
  }

  getDisplayPosition(x = this.x, y = this.y): { x: number; y: number } {
    let out = { x, y };

    if (this.path.matrix) {
      out = svgedit.math.transformPoint(this.x, this.y, this.path.matrix);
    }

    const zoom = workareaManager.zoomRatio;

    out.x *= zoom;
    out.y *= zoom;

    return out;
  }

  show(): void {
    const pointGripContainer = svgedit.path.getGripContainer();
    const id = `pathpointgrip_${this.index}`;
    let point = svgedit.utilities.getElem(id);
    const { x, y } = this.getDisplayPosition();

    // create it
    if (!point) {
      point = document.createElementNS(NS.SVG, 'circle');
      svgedit.utilities.assignAttributes(point, {
        cursor: 'move',
        display: 'block',
        fill: '#ffffff',
        id,
        r: GRIP_SIZE,
        stroke: '#0091ff',
        'stroke-width': 1,
        style: 'pointer-events:all',
      });
      point = pointGripContainer.appendChild(point);

      const i = this.index;
      const elem = $(`#${id}`);

      elem.dblclick(() => {
        if (svgedit.path.path) {
          svgedit.path.path.createControlPointsAtGrip(i);
        }
      });
    }

    svgedit.utilities.assignAttributes(point, {
      cx: x,
      cy: y,
      display: 'block',
    });
    this.elem = point;
  }

  hide(): void {
    const id = `pathpointgrip_${this.index}`;
    const point = svgedit.utilities.getElem(id);

    if (point) {
      svgedit.utilities.assignAttributes(point, {
        display: 'none',
      });
    }

    this.controlPoints.forEach((cp) => {
      cp.hide();
    });
  }

  update(): void {
    const id = `pathpointgrip_${this.index}`;
    const point = svgedit.utilities.getElem(id);
    const { x, y } = this.getDisplayPosition();

    // create it
    if (point) {
      svgedit.utilities.assignAttributes(point, {
        cx: x,
        cy: y,
      });
      this.elem = point;
    }

    this.controlPoints.forEach((cp) => {
      cp.update();
    });
  }

  setHighlight(isHighlighted: boolean): void {
    const id = `pathpointgrip_${this.index}`;
    const point = document.getElementById(id);

    if (!point) this.show();

    if (point) {
      point.setAttribute('fill', isHighlighted ? '#0091ff' : '#ffffff');
    }
  }

  setSelected(isSelected: boolean): void {
    this.isSelected = isSelected;
    this.setHighlight(isSelected);
    this.controlPoints.forEach((cp) => {
      if (isSelected) {
        cp.show();
      } else {
        cp.hide();
      }
    });
  }

  move(dx: number, dy: number) {
    const segChanges = {};

    this.x += dx;
    this.y += dy;

    if (this.mSeg) {
      segChanges[this.mSeg.index] = { x: this.x, y: this.y };
    }

    if (this.prevSeg) {
      segChanges[this.prevSeg.index] = { x: this.x, y: this.y };
    }

    for (let i = 0; i < this.controlPoints.length; i += 1) {
      const controlPoint = this.controlPoints[i];

      controlPoint.x += dx;
      controlPoint.y += dy;

      if (!segChanges[controlPoint.seg.index]) {
        segChanges[controlPoint.seg.index] = {};
      }

      segChanges[controlPoint.seg.index][`x${controlPoint.index}`] = controlPoint.x;
      segChanges[controlPoint.seg.index][`y${controlPoint.index}`] = controlPoint.y;
    }
    this.update();

    return segChanges;
  }

  createControlPoints(): any {
    const segChanges = {};
    const newControlPoints = [];

    // Segments that end here
    if (this.prevSeg && [4, 8].includes(this.prevSeg.item.pathSegType)) {
      const seg = this.prevSeg;
      const segItem = seg.item;
      const x = this.x + (seg.startPoint.x - this.x) / 3;
      const y = this.y + (seg.startPoint.y - this.y) / 3;

      if (segItem.pathSegType === 4) {
        // L
        segChanges[seg.index] = { pathSegType: 8, x1: x, y1: y };

        const newControlPoint = new svgedit.path.SegmentControlPoint(x, y, seg, 1);

        newControlPoints.push(newControlPoint);
        seg.controlPoints.push(newControlPoint);
      } else if (segItem.pathSegType === 8 && seg.controlPoints[0].nodePoint !== this) {
        // Q
        segChanges[seg.index] = { pathSegType: 6, x2: x, y2: y };

        const newControlPoint = new svgedit.path.SegmentControlPoint(x, y, seg, 2);

        newControlPoints.push(newControlPoint);
        seg.controlPoints.push(newControlPoint);
      }
    }

    if (this.nextSeg && [4, 8].includes(this.nextSeg.item.pathSegType)) {
      const seg = this.nextSeg;
      const segItem = seg.item;
      const x = this.x + (seg.endPoint.x - this.x) / 3;
      const y = this.y + (seg.endPoint.y - this.y) / 3;

      if (segItem.pathSegType === 4) {
        segChanges[seg.index] = { pathSegType: 8, x1: x, y1: y };

        const newControlPoint = new svgedit.path.SegmentControlPoint(x, y, seg, 1);

        newControlPoints.push(newControlPoint);
        seg.controlPoints.push(newControlPoint);
      } else if (segItem.pathSegType === 8 && seg.controlPoints[0].nodePoint !== this) {
        const currentControlPoint = seg.controlPoints[0];

        currentControlPoint.index = 2;
        segChanges[seg.index] = {
          pathSegType: 6,
          x1: x,
          x2: currentControlPoint.x,
          y1: y,
          y2: currentControlPoint.y,
        };

        const newControlPoint = new SegmentControlPoint(x, y, seg, 1);

        newControlPoints.push(newControlPoint);
        seg.controlPoints.push(newControlPoint);
      }
    }

    newControlPoints.forEach((cp) => {
      this.addControlPoint(cp);
      cp.show();
    });
    this.update();

    return segChanges;
  }

  setNodeType(newType: NodeLinkType): any {
    const segChanges = {};

    this.linkType = newType;

    if (this.controlPoints.length === 2 && newType !== LINKTYPE_CORNER) {
      const distancePoint = newType === LINKTYPE_SMOOTH ? this.controlPoints[1] : this.controlPoints[0];
      const th = Math.atan2(this.controlPoints[0].y - this.y, this.controlPoints[0].x - this.x) - Math.PI;
      const l = Math.hypot(distancePoint.x - this.x, distancePoint.y - this.y);
      const newPos = { x: l * Math.cos(th) + this.x, y: l * Math.sin(th) + this.y };
      const changes = this.controlPoints[1].moveAbs(newPos.x, newPos.y);

      Object.assign(segChanges, changes);
    }

    return segChanges;
  }

  delete(): any {
    const segChanges = {};
    let segIndexToRemove;

    if (this.mSeg) {
      if (this.next) {
        this.mSeg.endPoint = this.next;
        this.next.setMSeg(this.mSeg);
        segChanges[this.mSeg.index] = { x: this.next.x, y: this.next.y };
      }
    }

    if (this.prevSeg && this.nextSeg) {
      // 2 seg connecting: delete next seg, change prev seg
      const newSegControlPoints = [];

      segChanges[this.prevSeg.index] = { x: this.nextSeg.item.x, y: this.nextSeg.item.y };

      const prevControlPoint = this.prevSeg.controlPoints.find((cp) => cp.nodePoint !== this);

      if (prevControlPoint) {
        newSegControlPoints.push(prevControlPoint);
      }

      const nextControlPoint = this.nextSeg.controlPoints.find((cp) => cp.nodePoint !== this);

      if (nextControlPoint) {
        newSegControlPoints.push(nextControlPoint);
      }

      for (let i = 0; i < newSegControlPoints.length; i += 1) {
        const controlPoint = newSegControlPoints[i];

        controlPoint.index = i + 1;
        segChanges[this.prevSeg.index][`x${i + 1}`] = controlPoint.x;
        segChanges[this.prevSeg.index][`y${i + 1}`] = controlPoint.y;
        controlPoint.seg = this.prevSeg;
      }

      const newSegType = { 0: 4, 1: 8, 2: 6 }[newSegControlPoints.length];

      segChanges[this.prevSeg.index].pathSegType = newSegType;
      this.prevSeg.controlPoints = newSegControlPoints;
      this.prevSeg.endPoint = this.nextSeg.endPoint;
      this.nextSeg.startPoint = this.prevSeg.startPoint;

      if (this.prev) {
        this.prev.next = this.next;
      }

      if (this.next) {
        this.next.prev = this.prev;
      }

      segIndexToRemove = this.nextSeg.index;
    } else if (this.prevSeg) {
      // has prevSeg, no nextSeg: last point
      this.prev.next = null;
      segIndexToRemove = this.prevSeg.index;
    } else if (this.nextSeg) {
      // First point
      this.next.prev = null;
      segIndexToRemove = this.nextSeg.index;
    } else {
      segIndexToRemove = this.mSeg.index;
    }

    return { segChanges, segIndexToRemove };
  }

  isSharp(): boolean {
    const a = this.prevSeg && [4, 8].includes(this.prevSeg.item.pathSegType);
    const b = this.nextSeg && [4, 8].includes(this.nextSeg.item.pathSegType);

    return a || b;
  }

  isRound(): boolean {
    const a = this.prevSeg && [6, 8].includes(this.prevSeg.item.pathSegType);
    const b = this.nextSeg && [6, 8].includes(this.nextSeg.item.pathSegType);

    return a || b;
  }
}
