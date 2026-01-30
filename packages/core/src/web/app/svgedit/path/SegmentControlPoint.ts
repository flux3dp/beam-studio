import { LINKTYPE_CORNER, LINKTYPE_SMOOTH } from '@core/app/constants/link-type-constants';
import type { IPathNodePoint, ISegment } from '@core/interfaces/ISVGPath';

const { svgedit } = window;
const { NS } = svgedit;
const CONTROL_GRIP_SIZE = navigator.maxTouchPoints > 0 ? 7 : 4;

export default class SegmentControlPoint {
  x: number;

  y: number;

  seg: ISegment;

  index: number;

  nodePoint: IPathNodePoint;

  controlPointsLinkType: number;

  isSelected: boolean;

  elem: SVGElement;

  constructor(x: number, y: number, seg: ISegment, index: number) {
    this.x = x;
    this.y = y;
    this.seg = seg;
    this.index = index;
    this.nodePoint = null;
    this.controlPointsLinkType = 0; //
  }

  setSelected(isSelected: boolean): void {
    const id = `${this.seg.index}c${this.index}`;
    const point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);

    this.isSelected = isSelected;

    // create it
    if (point) {
      svgedit.utilities.assignAttributes(point, {
        fill: isSelected ? '#0091ff' : '#ffffff',
      });
    }
  }

  move(dx: number, dy: number): any {
    const segChanges = {};

    this.x += dx;
    this.y += dy;
    segChanges[this.seg.index] = {};
    segChanges[this.seg.index][`x${this.index}`] = this.x;
    segChanges[this.seg.index][`y${this.index}`] = this.y;
    this.update();

    return segChanges;
  }

  moveAbs(x: number, y: number) {
    const segChanges = {};

    this.x = x;
    this.y = y;
    segChanges[this.seg.index] = {};
    segChanges[this.seg.index][`x${this.index}`] = this.x;
    segChanges[this.seg.index][`y${this.index}`] = this.y;
    this.update();

    return segChanges;
  }

  moveLinkedControlPoint(): void {
    const segChanges = {};
    const { nodePoint } = this;

    if (nodePoint) {
      if (nodePoint.controlPoints.length === 2 && nodePoint.linkType !== LINKTYPE_CORNER) {
        const theOtherControlPoint = this.nodePoint.controlPoints.find((cp) => cp !== this);
        const { linkType, x: nodeX, y: nodeY } = nodePoint;

        if (!theOtherControlPoint) {
          return null;
        }

        const distancePoint = linkType === LINKTYPE_SMOOTH ? theOtherControlPoint : this;
        const th = Math.atan2(this.y - nodeY, this.x - nodeX) - Math.PI;
        const l = Math.hypot(distancePoint.x - nodeX, distancePoint.y - nodeY);
        const newPos = { x: l * Math.cos(th) + nodeX, y: l * Math.sin(th) + nodeY };
        const changes = theOtherControlPoint.moveAbs(newPos.x, newPos.y);

        Object.assign(segChanges, changes);
      }
    } else {
      console.error('Control Point without Node Point', this);
    }

    return segChanges;
  }

  show() {
    const id = `${this.seg.index}c${this.index}`;
    let point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);
    const { x, y } = svgedit.path.getGripPosition(this.x, this.y);

    if (!point) {
      point = document.createElementNS(NS.SVG, 'circle');
      svgedit.utilities.assignAttributes(point, {
        cursor: 'move',
        fill: '#ffffff',
        id: `ctrlpointgrip_${id}`,
        r: CONTROL_GRIP_SIZE,
        stroke: '#0091ff',
        'stroke-width': 1,
        style: 'pointer-events:all',
      });
      svgedit.path.getGripContainer().appendChild(point);
    }

    svgedit.utilities.assignAttributes(point, {
      cx: x,
      cy: y,
      display: 'block',
    });
    this.elem = point;

    const nodePointPosition = this.nodePoint ? this.nodePoint.getDisplayPosition() : { x, y };
    let ctrlLine = svgedit.utilities.getElem(`ctrlLine_${id}`);

    if (!ctrlLine) {
      ctrlLine = document.createElementNS(NS.SVG, 'line');
      svgedit.utilities.assignAttributes(ctrlLine, {
        id: `ctrlLine_${id}`,
        stroke: '#0091ff',
        'stroke-width': 1,
        style: 'pointer-events:none',
      });
      svgedit.path.getGripContainer().prepend(ctrlLine);
    }

    svgedit.utilities.assignAttributes(ctrlLine, {
      display: 'block',
      x1: nodePointPosition.x,
      x2: x,
      y1: nodePointPosition.y,
      y2: y,
    });

    return point;
  }

  update(): void {
    const id = `${this.seg.index}c${this.index}`;
    const { x, y } = svgedit.path.getGripPosition(this.x, this.y);
    const nodePointPosition = this.nodePoint ? this.nodePoint.getDisplayPosition() : { x, y };
    const point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);

    if (point) {
      svgedit.utilities.assignAttributes(point, {
        cx: x,
        cy: y,
      });
      this.elem = point;
    }

    const ctrlLine = svgedit.utilities.getElem(`ctrlLine_${id}`);

    if (ctrlLine) {
      svgedit.utilities.assignAttributes(ctrlLine, {
        x1: nodePointPosition.x,
        x2: x,
        y1: nodePointPosition.y,
        y2: y,
      });
    }
  }

  hide() {
    const id = `${this.seg.index}c${this.index}`;
    const point = svgedit.utilities.getElem(`ctrlpointgrip_${id}`);

    this.setSelected(false);

    if (point) {
      svgedit.utilities.assignAttributes(point, {
        display: 'none',
      });
    }

    const ctrlLine = svgedit.utilities.getElem(`ctrlLine_${id}`);

    if (ctrlLine) {
      svgedit.utilities.assignAttributes(ctrlLine, {
        display: 'none',
      });
    }
  }

  removeFromNodePoint(): void {
    const { nodePoint } = this;

    nodePoint.controlPoints = nodePoint.controlPoints.filter((cp) => cp !== this);
  }

  delete(): any {
    const { seg } = this;
    const segItem = seg.item;
    let changes = {};
    const segChanges = {};

    this.hide();

    if (segItem.pathSegType === 6) {
      changes = { pathSegType: 8 };

      if (this.index === 1) {
        const theOtherControlPoint = seg.controlPoints.find((cp) => cp !== this);

        if (theOtherControlPoint) {
          theOtherControlPoint.index = 1;
          changes = {
            ...changes,
            x1: theOtherControlPoint.x,
            y1: theOtherControlPoint.y,
          };
        }
      }
    } else if (segItem.pathSegType === 8) {
      changes = { pathSegType: 4 };
    }

    segChanges[this.seg.index] = changes;
    seg.controlPoints = seg.controlPoints.filter((cp) => cp !== this);
    this.removeFromNodePoint();

    return segChanges;
  }
}
