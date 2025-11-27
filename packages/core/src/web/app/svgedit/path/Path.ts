/* eslint-disable no-case-declarations */
import { LINKTYPE_SMOOTH, LINKTYPE_SYMMETRIC } from '@core/app/constants/link-type-constants';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { ISVGPath, ISVGPathSeg } from '@core/interfaces/ISVGPath';
import type ISVGPathElement from '@core/interfaces/ISVGPathElement';
import type { ISVGPathSegList } from '@core/interfaces/ISVGPathElement';

import PathNodePoint from './PathNodePoint';
import Segment from './Segment';
import type SegmentControlPoint from './SegmentControlPoint';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const { svgedit } = window;

const isCollinear = (x1, y1, x2, y2, x3, y3) => Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) <= 0.0001;

export default class Path implements ISVGPath {
  elem: ISVGPathElement;

  segs: Segment[];

  selected_pts: number[];

  selectedPointIndex: number;

  selectedControlPoint?: SegmentControlPoint;

  nodePoints: PathNodePoint[];

  first_seg: Segment;

  matrix: SVGMatrix;

  dragging: boolean | number[];

  dragctrl: boolean;

  lastD: string;

  imatrix: SVGMatrix;

  constructor(elem: SVGPathElement) {
    if (!elem || elem.tagName !== 'path') {
      throw new Error('svgedit.path.Path constructed without a <path> element');
    }

    this.elem = elem as unknown as ISVGPathElement;
    this.segs = [];
    this.selected_pts = [];
    svgedit.path.path = this;
    this.init();
  }

  init(): Path {
    // Hide all grips, etc

    // fixed, needed to work on all found elements, not just first
    $(svgedit.path.getGripContainer())
      .find('*')
      .each(function () {
        $(this).attr('display', 'none');
      });

    const segList = this.elem.pathSegList;
    const segInfo = JSON.parse(this.elem.getAttribute('data-segInfo') || '{}');
    const nodeTypes = JSON.parse(this.elem.getAttribute('data-nodeTypes') || '{}');

    const len = segList.numberOfItems;

    this.segs = [];
    this.nodePoints = [];
    this.selected_pts = [];
    this.first_seg = null;

    // Set up segs array
    for (let i = 0; i < len; i += 1) {
      const item = segList.getItem(i);
      const segment = new Segment(i, item);

      segment.path = this;
      this.segs.push(segment);
    }

    const { segs } = this;
    let startIndex = null;
    let lastGrip = null;

    for (let i = 0; i < len; i += 1) {
      const seg = segs[i];
      const nextSeg = i + 1 >= len ? null : segs[i + 1];
      const prevSeg = i - 1 < 0 ? null : segs[i - 1];
      let startSeg;

      if (seg.type === 2) {
        if (prevSeg && prevSeg.type !== 1) {
          // New sub-path, last one is open,
          // so add a grip to last sub-path's first point
          startSeg = segs[startIndex];
          startSeg.next = segs[startIndex + 1];
          startSeg.next.prev = startSeg;
        }

        // Remember that this is a starter seg
        const nodePoint = new PathNodePoint(seg.item.x, seg.item.y, seg, this);

        nodePoint.index = this.nodePoints.length;
        this.nodePoints.push(nodePoint);
        seg.endPoint = nodePoint;
        lastGrip = nodePoint;
        startIndex = i;
      } else if (nextSeg && nextSeg.type === 1) {
        // This is the last real segment of a closed sub-path
        // Next is first seg after "M"
        seg.next = segs[startIndex + 1];

        // First seg after "M"'s prev is this
        seg.next.prev = seg;
        seg.mate = segs[startIndex];

        const { controlPoints } = seg.getNodePointAndControlPoints();
        // First grip point
        const nodePoint = segs[startIndex].endPoint;

        nodePoint.setPrevSeg(seg);
        seg.startPoint = lastGrip;
        seg.endPoint = nodePoint;

        if (controlPoints.length === 2) {
          lastGrip.addControlPoint(controlPoints[0]);
          nodePoint.addControlPoint(controlPoints[1]);
        } else if (controlPoints.length === 1) {
          if (segInfo[i]) {
            nodePoint.addControlPoint(controlPoints[0]);
          } else {
            lastGrip.addControlPoint(controlPoints[0]);
          }
        }

        nodePoint.prev = lastGrip;
        lastGrip.next = nodePoint;
        lastGrip.nextSeg = seg;

        if (this.first_seg == null) {
          this.first_seg = seg;
        }
      } else if (!nextSeg) {
        if (seg.type !== 1) {
          // Last seg, doesn't close so add a grip
          // to last sub-path's first point
          startSeg = segs[startIndex];
          startSeg.next = segs[startIndex + 1];
          startSeg.next.prev = startSeg;

          const { controlPoints, nodePoint } = seg.getNodePointAndControlPoints();

          nodePoint.index = this.nodePoints.length;
          this.nodePoints.push(nodePoint);
          seg.startPoint = lastGrip;
          seg.endPoint = nodePoint;

          if (controlPoints.length === 2) {
            lastGrip.addControlPoint(controlPoints[0]);
            nodePoint.addControlPoint(controlPoints[1]);
          } else if (controlPoints.length === 1) {
            if (segInfo[i]) {
              nodePoint.addControlPoint(controlPoints[0]);
            } else {
              lastGrip.addControlPoint(controlPoints[0]);
            }
          }

          nodePoint.prev = lastGrip;
          lastGrip.next = nodePoint;
          lastGrip.nextSeg = seg;
          lastGrip = nodePoint;

          if (!this.first_seg) {
            // Open path, so set first as real first and add grip
            this.first_seg = segs[startIndex];
          }
        }
      } else if (seg.type !== 1) {
        // Regular segment, so add grip and its "next"
        const { controlPoints, nodePoint } = seg.getNodePointAndControlPoints();

        nodePoint.index = this.nodePoints.length;
        this.nodePoints.push(nodePoint);
        seg.startPoint = lastGrip;
        seg.endPoint = nodePoint;

        if (controlPoints.length === 2) {
          lastGrip.addControlPoint(controlPoints[0]);
          nodePoint.addControlPoint(controlPoints[1]);
        } else if (controlPoints.length === 1) {
          if (segInfo[i]) {
            nodePoint.addControlPoint(controlPoints[0]);
          } else {
            lastGrip.addControlPoint(controlPoints[0]);
          }
        }

        nodePoint.prev = lastGrip;
        lastGrip.next = nodePoint;
        lastGrip.nextSeg = seg;
        lastGrip = nodePoint;

        // Don't set its "next" if it's an "M"
        if (nextSeg && nextSeg.type !== 2) {
          seg.next = nextSeg;
          seg.next.prev = seg;
        }
      }
    }
    for (let i = 0; i < this.nodePoints.length; i += 1) {
      if (nodeTypes[i]) {
        this.nodePoints[i].linkType = nodeTypes[i];
      } else {
        const node = this.nodePoints[i];
        const a = node.controlPoints[0];
        const b = node.controlPoints[1];

        if (a && b) {
          if (isCollinear(a.x, a.y, node.x, node.y, b.x, b.y)) {
            node.linkType = LINKTYPE_SMOOTH;

            const dA = Math.hypot(a.x - node.x, a.y - node.y);
            const dB = Math.hypot(b.x - node.x, b.y - node.y);

            if (Math.abs(dA - dB) <= 0.0001) {
              node.linkType = LINKTYPE_SYMMETRIC;
            }
          }
        }
      }
    }
    this.clearSelection();

    return this;
  }

  eachSeg(fn: (index: number) => boolean | void): void {
    let i;
    const len = this.segs.length;

    for (i = 0; i < len; i += 1) {
      const ret = fn.call(this.segs[i], i);

      if (ret === false) {
        break;
      }
    }
  }

  addSeg(index: number, interpolation = 0.5): void {
    const t = interpolation;
    // Adds a new segment
    const seg = this.segs[index];

    if (!seg.prev) return;

    const { prev } = seg;
    let newseg;
    let newX;
    let newY;

    switch (seg.item.pathSegType) {
      case 4:
        newX = seg.item.x * (1 - t) + prev.item.x * t;
        newY = seg.item.y * (1 - t) + prev.item.y * t;
        newseg = this.elem.createSVGPathSegLinetoAbs(newX, newY);
        break;
      case 6: // make it a curved segment to preserve the shape (WRS)
        // http://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm#Geometric_interpretation
        const p0x = prev.item.x * t + seg.item.x1 * (1 - t);
        const p1x = seg.item.x1 * t + seg.item.x2 * (1 - t);
        const p2x = seg.item.x2 * t + seg.item.x * (1 - t);
        const p01x = p0x * t + p1x * (1 - t);
        const p12x = p1x * t + p2x * (1 - t);

        newX = p01x * t + p12x * (1 - t);

        const p0y = prev.item.y * t + seg.item.y1 * (1 - t);
        const p1y = seg.item.y1 * t + seg.item.y2 * (1 - t);
        const p2y = seg.item.y2 * t + seg.item.y * (1 - t);
        const p01y = p0y * t + p1y * (1 - t);
        const p12y = p1y * t + p2y * (1 - t);

        newY = p01y * t + p12y * (1 - t);
        newseg = this.elem.createSVGPathSegCurvetoCubicAbs(newX, newY, p0x, p0y, p01x, p01y);

        const pts = [seg.item.x, seg.item.y, p12x, p12y, p2x, p2y];

        svgedit.path.replacePathSeg(seg.type, index, pts);
        break;
      default:
        break;
    }

    svgedit.path.insertItemBefore(this.elem, newseg, index);
  }

  stripCurveFromSegment(segIndex: number): void {
    const seg = this.segs[segIndex];

    if (!seg.next) {
      return;
    }

    const nextSeg = seg.next;
    const segChanges = {};

    if ([6, 8].includes(seg.item.pathSegType)) {
      const { x, y } = seg.endPoint;

      segChanges[segIndex] = { pathSegType: 4, x, y };
    }

    if ([6, 8].includes(nextSeg.item.pathSegType)) {
      const { x, y } = nextSeg.endPoint;

      segChanges[nextSeg.index] = { pathSegType: 4, x, y };
    }

    this.applySegChanges(segChanges);
  }

  findSubpath(segIndex: number): {
    closingIndex: number;
    isHead: boolean;
    pathSize: number;
    startingIndex: number;
  } {
    // Starts with a move command and ends without closing command
    let closingIndex = this.segs.length - 1;

    for (let i = segIndex + 1; i < this.segs.length; i += 1) {
      closingIndex = i;

      if (this.segs[i].item.pathSegType < 4) {
        closingIndex = i - 1;
        break;
      }
    }

    // Find subpath starting
    let startingIndex = -1;

    for (let i = segIndex; i >= 0; i -= 1) {
      if (this.segs[i].item.pathSegType < 4) {
        startingIndex = i;
        break;
      }
    }

    if (startingIndex < 0) {
      throw new Error(`Unable to find starting seg from ${segIndex}`);
    }

    if (![2, 3].includes(this.segs[startingIndex].item.pathSegType)) {
      throw new Error('The starting segment must be a MoveTo command');
    }

    const pathSize = closingIndex - startingIndex;

    if (pathSize < 1) {
      throw new Error(`Cannot find valid subpath from index ${segIndex} ${startingIndex}~${closingIndex}`);
    }

    const isHead = startingIndex === segIndex;

    return {
      closingIndex,
      isHead,
      pathSize,
      startingIndex,
    };
  }

  buildPathSegs(
    subpath: {
      closingIndex: number;
      isHead: boolean;
      pathSize: number;
      startingIndex: number;
    },
    reverse: boolean,
  ): ISVGPathSeg[] {
    const pathSegs: ISVGPathSeg[] = [];

    console.log('Build path segs', subpath, reverse);

    if (reverse) {
      // Move to segment end point
      for (let i = subpath.startingIndex; i <= subpath.closingIndex; i += 1) {
        pathSegs.push(this.segs[i].item);
      }
      console.log('Raw segs', pathSegs);

      const dPath = svgCanvas.pathActions.convertPathSegToDPath(pathSegs);

      console.log('Before', dPath);

      const reversed = svgCanvas.pathActions.reverseDPath(dPath) as ISVGPathSegList;

      const results = [];

      for (let i = 0; i < reversed.numberOfItems; i += 1) {
        results.push(reversed.getItem(i));
      }
      console.log('After', results);

      return results;
    }

    for (let i = subpath.startingIndex; i <= subpath.closingIndex; i += 1) {
      pathSegs.push(this.segs[i].item);
    }

    return pathSegs;
  }

  connectNodes(pt1: number, pt2: number): number {
    const segList = this.elem.pathSegList as unknown as ISVGPathSegList;

    // Build pathseg list of subpath1, with pt1 as tail
    const subpath1 = this.findSubpath(pt1);
    const subpath1PathSegs = this.buildPathSegs(subpath1, subpath1.isHead);
    // Build pathseg list of subpath2, with pt2 as head
    const subpath2 = this.findSubpath(pt2);
    let subpath2PathSegs;

    if (subpath2.startingIndex === subpath1.startingIndex) {
      // If subpath2 === subpath1, just close the subpath1 at the end
      // todo, check if subpath1 ends with pt1
      subpath2PathSegs = [svgedit.path.createPathSeg(1)];
    } else {
      // Replace MoveTo subpath2 start into LineTo
      subpath2PathSegs = this.buildPathSegs(subpath2, !subpath2.isHead);

      const firstSeg = subpath2PathSegs[0];

      subpath2PathSegs[0] = svgedit.path.createPathSeg(4, [firstSeg.x, firstSeg.y], this.elem);
    }

    // Get all rest pathsegs
    const restPathSegs = this.segs
      .filter(
        (seg, i) =>
          (i > subpath1.closingIndex || i < subpath1.startingIndex) &&
          (i > subpath2.closingIndex || i < subpath2.startingIndex),
      )
      .map((seg) => seg.item);

    // Rebuild pathSeg
    segList.clear();
    subpath1PathSegs.forEach((pathSeg) => segList.appendItem(pathSeg));
    subpath2PathSegs.forEach((pathSeg) => segList.appendItem(pathSeg));
    restPathSegs.forEach((pathSeg) => segList.appendItem(pathSeg));
    // Rebuild segment items
    this.init();

    return 0;
  }

  disconnectNode(segIndex: number): number {
    // Get subpath starting and closing segment
    // Find subpath closing
    const subpath = this.findSubpath(segIndex);

    if (!subpath) return -1;

    const { closingIndex, pathSize, startingIndex } = subpath;

    if (this.segs[startingIndex + 1].startPoint.index === this.segs[closingIndex].endPoint?.index) {
      // The subpath is closed, starts from the current node, and then ends at current node
      console.log('Disconnecting closed path by', segIndex, 'from', startingIndex, 'to', closingIndex);

      const selectedSeg = this.segs[segIndex].item;

      const segChanges = {};
      const p = [`${startingIndex}->${segIndex}`];

      segChanges[startingIndex] = { pathSegType: 2, x: selectedSeg.x, y: selectedSeg.y };

      const tailSize = closingIndex - segIndex + 1;

      for (let j = 1; j <= pathSize; j += 1) {
        const srcIndex = j < tailSize ? segIndex + j : startingIndex + 1 + (j - tailSize);
        const src = this.segs[srcIndex].item;
        const { pathSegType, x, x1, x2, y, y1, y2 } = src;

        p.push(`${startingIndex + j}->${srcIndex}`);
        segChanges[startingIndex + j] = {
          pathSegType,
          x,
          x1,
          x2,
          y,
          y1,
          y2,
        };
      }
      this.applySegChanges(segChanges);

      if (this.segs[closingIndex + 1].item.pathSegType === 1) {
        this.deleteSeg(closingIndex + 1);
      }

      return closingIndex;
    }

    // The subpath is open, starts from the start node to current node,
    // and move to current node, then ends at the end node
    console.log('Disconnecting open path', startingIndex, closingIndex);

    const selectedSeg = this.segs[segIndex].item;
    const newMoveSeg = this.elem.createSVGPathSegMovetoAbs(selectedSeg.x, selectedSeg.y);

    svgedit.path.insertItemBefore(this.elem, newMoveSeg, segIndex + 1);

    return segIndex;
  }

  onDelete(textEdit, textPathEdit): void {
    if (this.selectedControlPoint) {
      this.deleteCtrlPoint();
      this.endChanges('Delete Path Control Point');
    } else if (this.selected_pts.length > 0) {
      this.deleteNodePoints(this.selected_pts);
      this.clearSelection();

      if (this.segs.length > 0) {
        this.endChanges('Delete Path Node Point(s)');
      } else {
        const batchCmd = new svgedit.history.BatchCommand('Delete Path Node and Delete Path');
        const changeDCmd = this.endChanges('Delete Path Node Point(s)', true);

        if (changeDCmd) {
          batchCmd.addSubCommand(changeDCmd);
        }

        let parent = this.elem.parentNode;

        if (parent) {
          if ((parent as SVGElement).getAttribute('data-textpath-g')) {
            const { cmd, text } = textPathEdit.detachText(parent, true);

            if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

            textEdit.renderText(text);
            parent = this.elem.parentNode;
          }

          if (parent) {
            this.elem.remove();

            const { nextSibling } = this.elem;

            batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(this.elem, nextSibling, parent));
          }
        }

        if (!batchCmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }

        setMouseMode('select');
      }
    }
  }

  deleteCtrlPoint(): void {
    if (this.selectedControlPoint) {
      const segChanges = this.selectedControlPoint.delete();

      this.applySegChanges(segChanges);
      this.addPtsToSelection([this.selectedControlPoint.nodePoint.index]);
      this.selectedControlPoint = null;
    }
  }

  deleteNodePoints(indices: number[]): void {
    // sort in descending order
    const sortedIndices = [...indices].sort((a, b) => b - a);

    this.hideAllNodes();
    for (let i = 0; i < sortedIndices.length; i += 1) {
      const nodePoint = this.nodePoints[sortedIndices[i]];
      const { segChanges, segIndexToRemove } = nodePoint.delete();

      this.applySegChanges(segChanges);
      this.nodePoints.splice(sortedIndices[i], 1);
      this.deleteSeg(segIndexToRemove);
    }
    this.nodePoints = this.nodePoints.filter((node) => node.prevSeg || node.nextSeg);
    this.nodePoints.forEach((node, i) => {
      node.index = i;
      node.show();
    });
  }

  private deleteSeg(index: number): void {
    const seg = this.segs[index];

    if (!seg) return;

    if (seg.endPoint && seg.endPoint.prevSeg === seg) {
      if (seg.prev.type !== 2) seg.endPoint.setPrevSeg(seg.prev);
      else seg.endPoint.setPrevSeg(null);
    }

    if (seg.startPoint && seg.startPoint.nextSeg === seg) seg.startPoint.nextSeg = seg.next;

    seg.controlPoints.forEach((cp) => {
      if (cp.seg === seg) {
        cp.removeFromNodePoint();
        cp.hide();
      }
    });

    if (seg.prev) seg.prev.next = seg.next;

    if (seg.next) seg.next.prev = seg.prev;

    // Clean Up M or Mz seg
    if (index > 0 && this.segs[index - 1].type === 2) {
      const mSegIndex = index - 1;

      if (index === this.segs.length - 1 || this.segs[index + 1].type === 2 || this.segs[index + 1].type === 1) {
        // Delete z seg
        if (this.segs.length - 1 > index && this.segs[index + 1].type === 1) {
          const zSegIndex = index + 1;

          this.deleteSeg(zSegIndex);
        }

        // Delete M seg
        this.deleteSeg(mSegIndex);
        index -= 1;

        if (seg.startPoint && !seg.startPoint.isSelected) {
          seg.startPoint.hide();
        }
      }
    }

    const segList = this.elem.pathSegList;

    segList.removeItem(index);
    this.segs.splice(index, 1);
    this.segs.forEach((segment, i) => {
      segment.index = i;
    });
  }

  subpathIsClosed(index: number): boolean {
    // Check if subpath is already open
    for (let i = index; i < this.segs.length; i += 1) {
      if (this.segs[i].type === 2) return false; // Found M first, so open

      if (this.segs[i].type === 1) return true; // Found Z first, so closed
    }

    return false;
  }

  clearSelection(): void {
    this.nodePoints.forEach((nodePoint) => {
      nodePoint.setSelected(false);
    });
    this.selected_pts = [];
    this.selectedControlPoint = null;
  }

  storeD(): void {
    this.lastD = this.elem.getAttribute('d');
  }

  show(y) {
    if (y) {
      this.showAllNodes();
    } else {
      this.hideAllNodes();
    }

    return this;
  }

  showAllNodes(): Path {
    this.nodePoints.forEach((nodePoint) => {
      nodePoint.show();
    });

    return this;
  }

  hideAllNodes(): Path {
    this.nodePoints.forEach((nodePoint) => {
      nodePoint.hide();
    });

    return this;
  }

  updateAllNodes(): Path {
    this.nodePoints.forEach((nodePoint) => {
      nodePoint.update();
    });

    return this;
  }

  endChanges(text: string, isSub = false): ICommand | null {
    const { elem, lastD } = this;

    elem.setAttribute('d', svgedit.utilities.convertPath(elem));

    const cmd = new svgedit.path.ChangeElementCommand(
      elem,
      {
        d: lastD,
      },
      text,
    );

    if (!isSub) {
      svgCanvas.addCommandToHistory(cmd);
    }

    svgCanvas.call('changed', [elem]);

    return isSub ? cmd : null;
  }

  createControlPointsAtGrip(index: number): void {
    const nodePoint = this.nodePoints[index];
    let segChanges = nodePoint.createControlPoints();

    svgedit.path.path.applySegChanges(segChanges);
    segChanges = nodePoint.setNodeType(nodePoint.linkType);
    svgedit.path.path.applySegChanges(segChanges);
    svgedit.path.path.endChanges('Add control points');
  }

  applySegChanges(segChanges): void {
    Object.entries<any>(segChanges).forEach(([index, changes]) => {
      const segItem = this.segs[index].item;
      const pathSegType = changes.pathSegType || segItem.pathSegType;

      this.segs[index].type = pathSegType;

      let newPoints;

      if (pathSegType === 6) {
        // C
        newPoints = [
          changes.x || segItem.x,
          changes.y || segItem.y,
          changes.x1 || segItem.x1,
          changes.y1 || segItem.y1,
          changes.x2 || segItem.x2,
          changes.y2 || segItem.y2,
        ];
      } else if (pathSegType === 8) {
        // Q
        newPoints = [
          changes.x || segItem.x,
          changes.y || segItem.y,
          changes.x1 || segItem.x1,
          changes.y1 || segItem.y1,
        ];
      } else if (pathSegType === 2 || pathSegType === 4) {
        // M or L
        newPoints = [changes.x || segItem.x, changes.y || segItem.y];
      }

      const newItem = svgedit.path.replacePathSeg(pathSegType, index, newPoints);

      this.segs[index].item = newItem;
    });
  }

  // Move selected points
  movePts(d_x: number, d_y: number): void {
    this.selected_pts.forEach((nodeIndex) => {
      const index = nodeIndex === this.nodePoints.length ? 0 : nodeIndex;
      const nodePoint = this.nodePoints[index];
      const segChanges = nodePoint.move(d_x, d_y);

      this.applySegChanges(segChanges);
    });
  }

  moveCtrl(d_x: number, d_y: number): void {
    if (this.selectedControlPoint) {
      let segChanges = this.selectedControlPoint.move(d_x, d_y);

      this.applySegChanges(segChanges);
      segChanges = this.selectedControlPoint.moveLinkedControlPoint();
      this.applySegChanges(segChanges);
    }
  }

  selectPt(pt: number): void {
    this.clearSelection();

    if (pt == null) {
      for (let i = 0; i < this.segs.length; i += 1) {
        if (this.segs[i].prev) pt = i;
      }
    }

    this.addPtsToSelection(pt);
  }

  selectCtrlPoint(segIndex: number, controlPointIndex: string): void {
    const seg = this.segs[segIndex];
    const controlPoint = seg.controlPoints.find((cp) => cp.index === Number.parseInt(controlPointIndex, 10));
    const { nodePoint } = controlPoint;

    if (this.selected_pts.length > 1 || this.selected_pts.length[0] !== nodePoint.index) {
      this.clearSelection();
      this.addPtsToSelection([nodePoint.index]);
    }

    nodePoint.setHighlight(false);
    controlPoint.nodePoint.controlPoints.forEach((cp) => {
      cp.setSelected(cp === controlPoint);
    });
    this.selectedControlPoint = controlPoint;
  }

  addPtsToSelection(indexes) {
    if (!Array.isArray(indexes)) {
      indexes = [indexes];
    }

    for (let i = 0; i < indexes.length; i += 1) {
      const index = indexes[i];

      if (index < this.nodePoints.length) {
        if (!this.selected_pts.includes(index) && index >= 0) {
          this.selected_pts.push(index);
        }
      }
    }
    this.selectedControlPoint = null;

    const isSelectingOnePoint = this.selected_pts.length <= 1;

    for (let i = 0; i < this.selected_pts.length; i += 1) {
      const index = this.selected_pts[i];
      const nodePoint = this.nodePoints[index];

      if (isSelectingOnePoint) {
        nodePoint.setSelected(true);
      } else {
        nodePoint.setSelected(true);
        nodePoint.controlPoints.forEach((cp) => cp.hide());
      }
    }
    svgCanvas.pathActions.canDeleteNodes = true;
  }

  removePtFromSelection(nodeIndex: number): void {
    const pos = this.selected_pts.indexOf(nodeIndex);

    if (pos === -1) {
      return;
    }

    const nodePoint = this.nodePoints[nodeIndex];

    nodePoint.setSelected(false);
    this.selected_pts.splice(pos, 1);

    const isSelectingOnePoint = this.selected_pts.length === 1;

    if (isSelectingOnePoint) {
      const i = this.selected_pts[0];
      const np = this.nodePoints[i];

      np.setSelected(true);
    }
  }

  // Update position of all points
  update(): Path {
    const { elem } = this;

    if (svgedit.utilities.getRotationAngle(elem)) {
      this.matrix = svgedit.math.getMatrix(elem);
      this.imatrix = this.matrix.inverse();
    } else {
      this.matrix = null;
      this.imatrix = null;
    }

    this.segs.forEach((seg, i) => {
      seg.item = elem.pathSegList.getItem(i);
      seg.update();
    });

    this.updateAllNodes();

    return this;
  }

  setSelectedNodeType(newNodeType): Path {
    for (let i = 0; i < this.selected_pts.length; i += 1) {
      const index = this.selected_pts[i];
      const nodePoint = this.nodePoints[index];
      const segChanges = nodePoint.setNodeType(newNodeType);

      this.applySegChanges(segChanges);
    }
    this.endChanges('Set Node Type');

    return this;
  }

  // Q segments have only one control point, noting which side it belongs to
  saveSegmentControlPointInfo(): Path {
    const segCPInfo = {};

    this.segs.forEach((seg) => {
      if (seg.type === 8) {
        const controlPoint = seg.controlPoints[0];

        if (!controlPoint) {
          return;
        }

        if (controlPoint.nodePoint.index === seg.startPoint.index) {
          segCPInfo[seg.index] = 0;
        } else {
          segCPInfo[seg.index] = 1;
        }
      }
    });
    this.elem.setAttribute('data-segInfo', JSON.stringify(segCPInfo));

    return this;
  }

  saveNodeTypeInfo(): Path {
    const nodeTypeInfo = {};

    this.nodePoints.forEach((nodePoint) => {
      nodeTypeInfo[nodePoint.index] = nodePoint.linkType || 0;
    });
    this.elem.setAttribute('data-nodeTypes', JSON.stringify(nodeTypeInfo));

    return this;
  }
}
