/**
 * Coords - Applies coordinate changes to elements based on transformation matrices.
 *
 * Licensed under the MIT License
 */

import { getBBox } from '../utils/getBBox';

import { getTransformList } from './transformlist';

declare const svgedit: any;

// Path segment type to command letter mapping
const pathMap = [0, 'z', 'M', 'm', 'L', 'l', 'C', 'c', 'Q', 'q', 'A', 'a', 'H', 'h', 'V', 'v', 'S', 's', 'T', 't'];

interface EditorContext {
  getDrawing: () => { getNextId: () => string };
}

let editorContext_: EditorContext | null = null;

export const init = (editorContext: EditorContext): void => {
  editorContext_ = editorContext;
};

/**
 * Applies coordinate changes to an element based on the given matrix
 * @param selected - DOM element to be changed
 * @param changes - Object with changes to be remapped
 * @param m - Matrix object to use for remapping coordinates
 */
export const remapElement = (selected: Element, changes: Record<string, any>, m: DOMMatrix): void => {
  const remap = (x: number, y: number) => svgedit.math.transformPoint(x, y, m);
  const scalew = (w: number) => svgedit.math.roundToDefault(m.a * w);
  const scaleh = (h: number) => svgedit.math.roundToDefault(m.d * h);
  const finishUp = () => {
    svgedit.utilities.assignAttributes(selected, changes, 1000, true);
  };
  const box = getBBox(selected as SVGGraphicsElement, { ignoreTransform: true });
  const getSvgRoot = () => document.getElementById('svgroot') as unknown as SVGSVGElement;

  for (let i = 0; i < 2; i++) {
    const type = i === 0 ? 'fill' : 'stroke';
    const attrVal = selected.getAttribute(type);

    if (attrVal && attrVal.indexOf('url(') === 0) {
      if (m.a < 0 || m.d < 0) {
        const grad = svgedit.utilities.getRefElem(attrVal);
        const newgrad = grad.cloneNode(true) as Element;

        if (m.a < 0) {
          const x1 = newgrad.getAttribute('x1');
          const x2 = newgrad.getAttribute('x2');

          newgrad.setAttribute('x1', String(-(Number(x1) - 1)));
          newgrad.setAttribute('x2', String(-(Number(x2) - 1)));
        }

        if (m.d < 0) {
          const y1 = newgrad.getAttribute('y1');
          const y2 = newgrad.getAttribute('y2');

          newgrad.setAttribute('y1', String(-(Number(y1) - 1)));
          newgrad.setAttribute('y2', String(-(Number(y2) - 1)));
        }

        newgrad.id = editorContext_!.getDrawing().getNextId();
        svgedit.utilities.findDefs().appendChild(newgrad);
        selected.setAttribute(type, `url(#${newgrad.id})`);
      }
    }
  }

  const elName = selected.tagName;

  if (elName === 'g' || elName === 'text' || elName === 'tspan' || elName === 'use') {
    // if it was a translate, then just update x,y
    if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && (m.e !== 0 || m.f !== 0)) {
      // [T][M] = [M][T']
      // therefore [T'] = [M_inv][T][M]
      const existing = svgedit.math.transformListToTransform(selected).matrix;
      const t_new = svgedit.math.matrixMultiply(existing.inverse(), m, existing);

      if (typeof changes.x === 'string') {
        const x = changes.x.split(' ').map((e: string) => Number.parseFloat(e) + t_new.e);

        changes.x = x.join(' ');
      } else {
        changes.x = Number.parseFloat(changes.x) + t_new.e;
      }

      if (typeof changes.y === 'string') {
        const y = changes.y.split(' ').map((e: string) => Number.parseFloat(e) + t_new.f);

        changes.y = y.join(' ');
      } else {
        changes.y = Number.parseFloat(changes.y) + t_new.f;
      }
    } else {
      // we just absorb all matrices into the element and don't do any remapping
      const chlist = getTransformList(selected as SVGGraphicsElement);

      if (chlist && (chlist.numberOfItems > 0 || elName !== 'tspan')) {
        const svgroot = getSvgRoot();
        const mt = svgroot.createSVGTransform();

        mt.setMatrix(svgedit.math.matrixMultiply(svgedit.math.transformListToTransform(chlist).matrix, m));
        chlist.clear();
        chlist.appendItem(mt);
      }
    }
  }

  // now we have a set of changes and an applied reduced transform list
  // we apply the changes directly to the DOM
  switch (elName) {
    case 'foreignObject':
    case 'rect':
    case 'image': {
      // Allow images to be inverted (give them matrix when flipped)
      if (elName === 'image' && (m.a < 0 || m.d < 0)) {
        const chlist = getTransformList(selected as SVGGraphicsElement);

        if (chlist) {
          const svgroot = getSvgRoot();
          const mt = svgroot.createSVGTransform();

          mt.setMatrix(svgedit.math.matrixMultiply(svgedit.math.transformListToTransform(chlist).matrix, m));
          chlist.clear();
          chlist.appendItem(mt);
        }
      } else {
        const pt1 = remap(changes.x, changes.y);

        changes.width = scalew(changes.width);
        changes.height = scaleh(changes.height);
        changes.x = pt1.x + Math.min(0, changes.width);
        changes.y = pt1.y + Math.min(0, changes.height);
        changes.width = Math.abs(changes.width);
        changes.height = Math.abs(changes.height);
      }

      finishUp();
      break;
    }
    case 'ellipse': {
      const c = remap(changes.cx, changes.cy);

      changes.cx = c.x;
      changes.cy = c.y;
      changes.rx = Math.abs(scalew(changes.rx));
      changes.ry = Math.abs(scaleh(changes.ry));
      finishUp();
      break;
    }
    case 'circle': {
      const c = remap(changes.cx, changes.cy);

      changes.cx = c.x;
      changes.cy = c.y;

      const tbox = svgedit.math.transformBox(box.x, box.y, box.width, box.height, m);
      const w = tbox.tr.x - tbox.tl.x;
      const h = tbox.bl.y - tbox.tl.y;

      changes.r = Math.min(w / 2, h / 2);

      if (changes.r) {
        changes.r = Math.abs(changes.r);
      }

      finishUp();
      break;
    }
    case 'line': {
      const pt1 = remap(changes.x1, changes.y1);
      const pt2 = remap(changes.x2, changes.y2);

      changes.x1 = pt1.x;
      changes.y1 = pt1.y;
      changes.x2 = pt2.x;
      changes.y2 = pt2.y;
      finishUp();
      break;
    }
    case 'text':
    case 'tspan':
    case 'use':
      finishUp();
      break;
    case 'g': {
      // gsvg data is stored via jQuery.data() — use $ to read it for compatibility
      const $ = (window as any).jQuery || (window as any).$;
      const gsvg = $ ? $(selected).data('gsvg') : null;

      if (gsvg) {
        svgedit.utilities.assignAttributes(gsvg, changes, 1000, true);
      }

      break;
    }
    case 'polyline':
    case 'polygon': {
      const len = changes.points.length;

      for (let i = 0; i < len; ++i) {
        const pt = remap(changes.points[i].x, changes.points[i].y);

        changes.points[i].x = pt.x;
        changes.points[i].y = pt.y;
      }

      let pstr = '';

      for (let i = 0; i < len; ++i) {
        pstr += `${changes.points[i].x},${changes.points[i].y} `;
      }
      selected.setAttribute('points', pstr);

      if (changes.cx && changes.cy) {
        const c = remap(changes.cx, changes.cy);

        changes.cx = c.x;
        changes.cy = c.y;
        selected.setAttribute('cx', String(changes.cx));
        selected.setAttribute('cy', String(changes.cy));
      }

      break;
    }
    case 'path': {
      const segList = (selected as any).pathSegList;
      const len = segList.numberOfItems;

      changes.d = [];
      for (let i = 0; i < len; ++i) {
        const seg = segList.getItem(i);

        changes.d[i] = {
          angle: seg.angle,
          largeArcFlag: seg.largeArcFlag,
          r1: seg.r1,
          r2: seg.r2,
          sweepFlag: seg.sweepFlag,
          type: seg.pathSegType,
          x: seg.x,
          x1: seg.x1,
          x2: seg.x2,
          y: seg.y,
          y1: seg.y1,
          y2: seg.y2,
        };
      }

      if (changes.d.length === 0) break;

      const firstseg = changes.d[0];
      const currentpt = remap(firstseg.x, firstseg.y);

      changes.d[0].x = currentpt.x;
      changes.d[0].y = currentpt.y;

      for (let i = 1; i < changes.d.length; ++i) {
        const seg = changes.d[i];
        const segType = seg.type;

        if (segType % 2 === 0) {
          // absolute
          const thisx = seg.x != null ? seg.x : currentpt.x;
          const thisy = seg.y != null ? seg.y : currentpt.y;
          const pt = remap(thisx, thisy);
          const pt1 = remap(seg.x1, seg.y1);
          const pt2 = remap(seg.x2, seg.y2);

          seg.x = pt.x;
          seg.y = pt.y;
          seg.x1 = pt1.x;
          seg.y1 = pt1.y;
          seg.x2 = pt2.x;
          seg.y2 = pt2.y;
          seg.r1 = scalew(seg.r1);
          seg.r2 = scaleh(seg.r2);
        } else {
          // relative
          seg.x = scalew(seg.x);
          seg.y = scaleh(seg.y);
          seg.x1 = scalew(seg.x1);
          seg.y1 = scaleh(seg.y1);
          seg.x2 = scalew(seg.x2);
          seg.y2 = scaleh(seg.y2);
          seg.r1 = scalew(seg.r1);
          seg.r2 = scaleh(seg.r2);
        }
      }

      let dstr = '';

      for (let i = 0; i < changes.d.length; ++i) {
        const seg = changes.d[i];
        const segType = seg.type;

        dstr += pathMap[segType];
        switch (segType) {
          case 13: // relative horizontal line (h)
          case 12: // absolute horizontal line (H)
            dstr += `${seg.x} `;
            break;
          case 15: // relative vertical line (v)
          case 14: // absolute vertical line (V)
            dstr += `${seg.y} `;
            break;
          case 3: // relative move (m)
          case 5: // relative line (l)
          case 19: // relative smooth quad (t)
          case 2: // absolute move (M)
          case 4: // absolute line (L)
          case 18: // absolute smooth quad (T)
            dstr += `${seg.x},${seg.y} `;
            break;
          case 7: // relative cubic (c)
          case 6: // absolute cubic (C)
            dstr += `${seg.x1},${seg.y1} ${seg.x2},${seg.y2} ${seg.x},${seg.y} `;
            break;
          case 9: // relative quad (q)
          case 8: // absolute quad (Q)
            dstr += `${seg.x1},${seg.y1} ${seg.x},${seg.y} `;
            break;
          case 11: // relative elliptical arc (a)
          case 10: // absolute elliptical arc (A)
            dstr += `${seg.r1},${seg.r2} ${seg.angle} ${+seg.largeArcFlag} ${+seg.sweepFlag} ${seg.x},${seg.y} `;
            break;
          case 17: // relative smooth cubic (s)
          case 16: // absolute smooth cubic (S)
            dstr += `${seg.x2},${seg.y2} ${seg.x},${seg.y} `;
            break;
        }
      }
      selected.setAttribute('d', dstr);
      break;
    }
  }
};
