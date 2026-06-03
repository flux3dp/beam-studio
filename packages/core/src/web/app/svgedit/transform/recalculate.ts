/**
 * Recalculate - Simplifies SVG element transforms by absorbing translate/scale into
 * element attributes, leaving only rotation (or [R][M] when absorption is not possible).
 *
 * Licensed under the MIT License
 */

import NS from '@core/app/constants/namespaces';
import { BatchCommand, ChangeElementCommand } from '@core/app/svgedit/history/history';

import { getBBox } from '../utils/getBBox';

import { remapElement } from './coords';
import { getRotationAngle } from './rotation';
import { getTransformList } from './transformlist';

declare const svgedit: any;

const isNegligible = (n: number): boolean => Math.abs(n) < 1e-7;

let startTransform: null | string = null;

export const getStartTransform = (): null | string => startTransform;

export const setStartTransform = (transform: null | string): void => {
  startTransform = transform;
};

/**
 * Updates a <clipPath>'s values based on the given translation of an element
 */
export const updateClipPath = (attr: string, tx: number, ty: number): void => {
  const refElem = svgedit.utilities.getRefElem(attr);
  const path = refElem.firstChild;
  const cpXform = getTransformList(path);
  const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
  const newxlate = svgroot.createSVGTransform();

  newxlate.setTranslate(tx, ty);
  cpXform!.appendItem(newxlate);
  recalculateDimensions(path);
};

// Helper: get multiple attributes as an object
const getAttrs = (el: Element, attrs: string[]): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const attr of attrs) {
    result[attr] = el.getAttribute(attr) ?? '';
  }

  return result;
};

// Helper: insert rotation transform at the front of a transform list
const insertRotation = (tlist: SVGTransformList, rot: SVGTransform): void => {
  if (tlist.numberOfItems) {
    tlist.insertItemBefore(rot, 0);
  } else {
    tlist.appendItem(rot);
  }
};

// Helper: remap tspan children for text elements
const remapTspanChildren = (
  selected: Element,
  matrix: DOMMatrix,
  batchCmd: InstanceType<typeof BatchCommand>,
): void => {
  const children = selected.childNodes;
  let c = children.length;

  while (c--) {
    const child = children.item(c) as Element;

    if (child.tagName === 'tspan') {
      const tspanChanges: Record<string, any> = {
        x: child.getAttribute('x') || 0,
        y: child.getAttribute('y') || 0,
      };
      const orig = { ...tspanChanges };

      remapElement(child, tspanChanges, matrix);
      batchCmd.addSubCommand(new ChangeElementCommand(child, orig));
    }
  }
};

/**
 * Decides the course of action based on the element's transform list.
 * Absorbs translate/scale into element attributes, keeping only rotation.
 *
 * @returns Undo command object with the resulting change, or null
 */
export const recalculateDimensions = (selected: Element): InstanceType<typeof BatchCommand> | null => {
  if (selected == null) return null;

  // Firefox Issue - 1081
  if (selected.nodeName === 'svg' && navigator.userAgent.includes('Firefox/20')) return null;

  const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
  const tlist = getTransformList(selected as SVGGraphicsElement);

  if (!tlist) return null;

  if (selected.getAttribute('data-textpath') === '1') {
    selected.removeAttribute('x');
    selected.setAttribute('transform', '');
    selected.removeAttribute('transform');
    tlist.clear();

    return null;
  }

  // Remove unnecessary transforms
  if (tlist.numberOfItems > 0) {
    let k = tlist.numberOfItems;

    while (k--) {
      const xform = tlist.getItem(k);

      if (xform.type === 0) {
        tlist.removeItem(k);
      } else if (xform.type === 1) {
        if (svgedit.math.isIdentity(xform.matrix)) {
          tlist.removeItem(k);
        } else if (
          xform.matrix.a === 1 &&
          isNegligible(xform.matrix.b) &&
          isNegligible(xform.matrix.c) &&
          xform.matrix.d === 1
        ) {
          const { e, f } = xform.matrix;
          const translate = svgroot.createSVGTransform();

          translate.setTranslate(e, f);
          tlist.replaceItem(translate, k);
        }
      } else if (xform.type === 4 && xform.angle === 0) {
        tlist.removeItem(k);
      }
    }

    if (selected.tagName !== 'text' && selected.tagName !== 'use') {
      if (tlist.numberOfItems === 1 && getRotationAngle(selected as SVGElement)) return null;
    }
  }

  // If this element had no transforms, we are done
  if (tlist.numberOfItems === 0) {
    selected.setAttribute('transform', '');
    selected.removeAttribute('transform');

    return null;
  }

  // Combine adjacent matrix transforms
  {
    let k = tlist.numberOfItems;
    const mxs: Array<[DOMMatrix, number]> = [];

    while (k--) {
      const xform = tlist.getItem(k);

      if (xform.type === 1) {
        mxs.push([xform.matrix, k]);
      } else if (mxs.length) {
        break;
      }
    }

    if (mxs.length === 2) {
      const mNew = svgroot.createSVGTransformFromMatrix(svgedit.math.matrixMultiply(mxs[1][0], mxs[0][0]));

      tlist.removeItem(mxs[0][1]);
      tlist.removeItem(mxs[1][1]);
      tlist.insertItemBefore(mNew, mxs[1][1]);
    }

    // Combine matrix + translate
    const n = tlist.numberOfItems;

    if (n >= 2 && tlist.getItem(n - 2).type === 1 && tlist.getItem(n - 1).type === 2) {
      const mt = svgroot.createSVGTransform();
      const combined = svgedit.math.matrixMultiply(tlist.getItem(n - 2).matrix, tlist.getItem(n - 1).matrix);

      mt.setMatrix(combined);
      tlist.removeItem(n - 2);
      tlist.removeItem(n - 2);
      tlist.appendItem(mt);
    }
  }

  // If it still has a single [M] or [R][M], return null (prevents BatchCommand from being returned)
  switch (selected.tagName) {
    case 'line':
    case 'polyline':
    case 'polygon':
    case 'path':
    case 'g':
      break;
    default:
      if (tlist.numberOfItems === 1 && tlist.getItem(0).type === 1) {
        const matrix = tlist.getItem(0).matrix;

        if (!isNegligible(matrix.b) || !isNegligible(matrix.c)) {
          return null;
        }
      }
  }

  // Grouped SVG element
  const $ = (window as any).jQuery || (window as any).$;
  const gsvg = $ ? $(selected).data('gsvg') : null;

  const batchCmd = new BatchCommand('Transform');

  // Store initial values that will be affected by reducing the transform list
  let changes: Record<string, any> = {};
  let initial: null | Record<string, any> = null;
  let attrs: string[] = [];

  switch (selected.tagName) {
    case 'line':
      attrs = ['x1', 'y1', 'x2', 'y2'];
      break;
    case 'circle':
      attrs = ['cx', 'cy', 'r'];
      break;
    case 'ellipse':
      attrs = ['cx', 'cy', 'rx', 'ry'];
      break;
    case 'foreignObject':
    case 'rect':
    case 'image':
      attrs = ['width', 'height', 'x', 'y'];
      break;
    case 'use':
    case 'text':
    case 'tspan':
      attrs = ['x', 'y'];
      break;
    case 'polygon':
    case 'polyline': {
      initial = {};
      initial.points = selected.getAttribute('points');

      const list = (selected as SVGPolygonElement).points;
      const len = list.numberOfItems;

      changes.points = Array.from({ length: len }).map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < len; ++i) {
        const pt = list.getItem(i);

        changes.points[i] = { x: pt.x, y: pt.y };
      }

      const cx = selected.getAttribute('cx');
      const cy = selected.getAttribute('cy');

      if (cx) {
        initial.cx = cx;
        changes.cx = svgedit.units.convertToNum('cx', cx);
      }

      if (cy) {
        initial.cy = cy;
        changes.cy = svgedit.units.convertToNum('cy', cy);
      }

      break;
    }
    case 'path':
      initial = {};
      initial.d = selected.getAttribute('d');
      changes.d = selected.getAttribute('d');
      break;
  }

  if (attrs.length) {
    changes = getAttrs(selected, attrs);
    for (const [attr, val] of Object.entries(changes)) {
      changes[attr] = svgedit.units.convertToNum(attr, val);
    }
  } else if (gsvg) {
    changes = {
      x: gsvg.getAttribute('x') || 0,
      y: gsvg.getAttribute('y') || 0,
    };
  }

  // If we haven't created an initial array in polygon/polyline/path, make a copy
  if (initial == null) {
    initial = JSON.parse(JSON.stringify(changes)) as any as Record<string, any>;
    for (const [attr, val] of Object.entries(initial)) {
      initial[attr] = svgedit.units.convertToNum(attr, val);
    }
  }

  initial.transform = startTransform || '';

  // GROUP HANDLING
  if ((selected.tagName === 'g' && !gsvg) || selected.tagName === 'a') {
    const box = getBBox(selected as SVGGraphicsElement, { ignoreTransform: true });
    const oldCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    let newCenter = svgedit.math.transformPoint(
      box.x + box.width / 2,
      box.y + box.height / 2,
      svgedit.math.transformListToTransform(tlist).matrix,
    );
    let m = svgroot.createSVGMatrix();

    // Temporarily strip off the rotate and save the old center
    const gAngle = getRotationAngle(selected as SVGElement);

    if (gAngle) {
      const a = (gAngle * Math.PI) / 180;
      const s = Math.abs(a) > 1.0e-10 ? Math.sin(a) / (1 - Math.cos(a)) : 2 / a;

      for (let i = 0; i < tlist.numberOfItems; ++i) {
        const xform = tlist.getItem(i);

        if (xform.type === 4) {
          const rm = xform.matrix;

          oldCenter.y = (s * rm.e + rm.f) / 2;
          oldCenter.x = (rm.e - s * rm.f) / 2;
          tlist.removeItem(i);
          break;
        }
      }
    }

    let tx = 0;
    let ty = 0;
    let operation = 0;
    const N = tlist.numberOfItems;
    const first_m = N ? tlist.getItem(0).matrix : null;

    // Scale: [T][S][-T]
    if (
      N >= 3 &&
      tlist.getItem(N - 2).type === 3 &&
      tlist.getItem(N - 3).type === 2 &&
      tlist.getItem(N - 1).type === 2
    ) {
      operation = 3;

      const tm = tlist.getItem(N - 3).matrix;
      const sm = tlist.getItem(N - 2).matrix;
      const tmn = tlist.getItem(N - 1).matrix;

      const children = selected.childNodes;
      let c = children.length;

      while (c--) {
        const child = children.item(c) as Element;

        tx = 0;
        ty = 0;

        if (child.nodeType === 1) {
          const childTlist = getTransformList(child as SVGGraphicsElement);

          if (!childTlist) continue;

          let r: null | { angle: number; center: { x: number; y: number } } = null;

          if (childTlist.numberOfItems > 0) {
            const t0 = childTlist.getItem(0);

            if (t0.type === 4) {
              const { a, b, e, f } = t0.matrix;
              const x = (a * e + b * f - e) / (2 * a - 2);
              const y = (b * e - a * f + f) / (2 - 2 * a);

              r = { angle: t0.angle, center: { x, y } };
            }
          }

          m = svgedit.math.transformListToTransform(childTlist).matrix;

          const childAngle = getRotationAngle(child as SVGElement);
          const oldStartTransform = startTransform;

          startTransform = child.getAttribute('transform');

          if (childAngle || svgedit.math.hasMatrixTransform(childTlist)) {
            const e2t = svgroot.createSVGTransform();

            if (r) {
              const newCenter = svgedit.math.transformPoint(
                r.center.x,
                r.center.y,
                svgedit.math.transformListToTransform(tlist).matrix,
              );
              const rotationBack = svgroot.createSVGTransform();

              rotationBack.setRotate(-r.angle, newCenter.x, newCenter.y);
              e2t.setMatrix(svgedit.math.matrixMultiply(rotationBack.matrix, tm, sm, tmn, m));

              const rotation = svgroot.createSVGTransform();

              rotation.setRotate(r.angle, newCenter.x, newCenter.y);
              childTlist.clear();
              childTlist.appendItem(rotation);
            } else {
              e2t.setMatrix(svgedit.math.matrixMultiply(tm, sm, tmn, m));
              childTlist.clear();
            }

            childTlist.appendItem(e2t);
          } else {
            // Not rotated or skewed: push [T][S][-T] down to the child
            const t2n = svgedit.math.matrixMultiply(m.inverse(), tmn, m);
            const t2 = svgroot.createSVGMatrix();

            t2.e = -t2n.e;
            t2.f = -t2n.f;

            const s2 = svgedit.math.matrixMultiply(t2.inverse(), m.inverse(), tm, sm, tmn, m, t2n.inverse());

            const translateOrigin = svgroot.createSVGTransform();
            const scale = svgroot.createSVGTransform();
            const translateBack = svgroot.createSVGTransform();

            translateOrigin.setTranslate(t2n.e, t2n.f);
            scale.setScale(s2.a, s2.d);
            translateBack.setTranslate(t2.e, t2.f);
            childTlist.appendItem(translateBack);
            childTlist.appendItem(scale);
            childTlist.appendItem(translateOrigin);
          }

          batchCmd.addSubCommand(recalculateDimensions(child)!);
          startTransform = oldStartTransform;
        }
      }
      tlist.removeItem(N - 1);
      tlist.removeItem(N - 2);
      tlist.removeItem(N - 3);
    } else if (N >= 3 && tlist.getItem(N - 1).type === 1) {
      operation = 3;
      m = svgedit.math.transformListToTransform(tlist).matrix;

      const e2t = svgroot.createSVGTransform();

      e2t.setMatrix(m);
      tlist.clear();
      tlist.appendItem(e2t);
    } else if ((N === 1 || (N > 1 && tlist.getItem(1).type !== 3)) && tlist.getItem(0).type === 2) {
      // Translate: [T1][M] → [M][T2]
      operation = 2;

      const T_M = svgedit.math.transformListToTransform(tlist).matrix;

      tlist.removeItem(0);

      const M_inv = svgedit.math.transformListToTransform(tlist).matrix.inverse();
      const M2 = svgedit.math.matrixMultiply(M_inv, T_M);

      tx = M2.e;
      ty = M2.f;

      if (tx !== 0 || ty !== 0) {
        const children = selected.childNodes;
        let c = children.length;

        while (c--) {
          const child = children.item(c) as Element;

          if (child.nodeType === 1) {
            const oldStartTransform = startTransform;

            startTransform = child.getAttribute('transform');

            const childTlist = getTransformList(child as SVGGraphicsElement);

            if (childTlist) {
              const newxlate = svgroot.createSVGTransform();

              newxlate.setTranslate(tx, ty);

              if (childTlist.numberOfItems) {
                childTlist.insertItemBefore(newxlate, 0);
              } else {
                childTlist.appendItem(newxlate);
              }

              batchCmd.addSubCommand(recalculateDimensions(child)!);

              // Impose reverse translate on <use> elements referencing this child
              const uses = selected.getElementsByTagNameNS(NS.SVG, 'use');
              const href = `#${child.id}`;
              let u = uses.length;

              while (u--) {
                const useElem = uses.item(u)!;

                if (href === svgedit.utilities.getHref(useElem)) {
                  const usexlate = svgroot.createSVGTransform();

                  usexlate.setTranslate(-tx, -ty);
                  getTransformList(useElem as unknown as SVGGraphicsElement)!.insertItemBefore(usexlate, 0);
                  batchCmd.addSubCommand(recalculateDimensions(useElem)!);
                }
              }
              startTransform = oldStartTransform;
            }
          }
        }
      }
    } else if (N === 1 && tlist.getItem(0).type === 1 && !gAngle) {
      // Matrix imposition from parent group
      operation = 1;
      m = tlist.getItem(0).matrix;

      const children = selected.childNodes;
      let c = children.length;

      while (c--) {
        const child = children.item(c) as Element;

        if (child.nodeType === 1) {
          const oldStartTransform = startTransform;

          startTransform = child.getAttribute('transform');

          const childTlist = getTransformList(child as SVGGraphicsElement);

          if (!childTlist) continue;

          const em = svgedit.math.matrixMultiply(m, svgedit.math.transformListToTransform(childTlist).matrix);
          const e2m = svgroot.createSVGTransform();

          e2m.setMatrix(em);
          childTlist.clear();
          childTlist.appendItem(e2m);

          batchCmd.addSubCommand(recalculateDimensions(child)!);
          startTransform = oldStartTransform;

          // Convert stroke width
          const sw = child.getAttribute('stroke-width');

          if (child.getAttribute('stroke') !== 'none' && sw && !Number.isNaN(Number(sw))) {
            const avg = (Math.abs(em.a) + Math.abs(em.d)) / 2;

            child.setAttribute('stroke-width', String(Number(sw) * avg));
          }
        }
      }
      tlist.clear();
    } else if (N > 1) {
      // Concat all transforms and pass down
      const concatM = svgedit.math.transformListToTransform(tlist).matrix;
      const children = selected.childNodes;
      let c = children.length;

      while (c--) {
        const child = children.item(c) as Element;

        if (child.nodeType === 1) {
          const oldStartTransform = startTransform;

          startTransform = child.getAttribute('transform');

          const childTlist = getTransformList(child as SVGGraphicsElement);

          if (!childTlist) continue;

          const em = svgroot.createSVGTransform();

          em.setMatrix(concatM);

          if (childTlist.numberOfItems) {
            childTlist.insertItemBefore(em, 0);
          } else {
            childTlist.appendItem(em);
          }

          const cmd = recalculateDimensions(child);

          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }

          startTransform = oldStartTransform;
        }
      }
      tlist.clear();
    } else {
      // Just a rotate
      if (gAngle) {
        const newRot = svgroot.createSVGTransform();

        newRot.setRotate(gAngle, newCenter.x, newCenter.y);
        insertRotation(tlist, newRot);
      }

      if (tlist.numberOfItems === 0) {
        selected.removeAttribute('transform');
      }

      return null;
    }

    // Post-processing: re-insert rotation at the correct center
    if (operation === 2) {
      if (gAngle) {
        newCenter = {
          x: oldCenter.x + first_m!.e,
          y: oldCenter.y + first_m!.f,
        };

        const newRot = svgroot.createSVGTransform();

        newRot.setRotate(gAngle, newCenter.x, newCenter.y);
        insertRotation(tlist, newRot);
      }
    } else if (operation === 3) {
      m = svgedit.math.transformListToTransform(tlist).matrix;

      const roldt = svgroot.createSVGTransform();

      roldt.setRotate(gAngle, oldCenter.x, oldCenter.y);

      const rold = roldt.matrix;
      const rnew = svgroot.createSVGTransform();

      rnew.setRotate(gAngle, newCenter.x, newCenter.y);

      const rnewInv = rnew.matrix.inverse();
      const mInv = m.inverse();
      const extrat = svgedit.math.matrixMultiply(mInv, rnewInv, rold, m);

      tx = extrat.e;
      ty = extrat.f;

      if (tx !== 0 || ty !== 0) {
        const children = selected.childNodes;
        let c = children.length;

        while (c--) {
          const child = children.item(c) as Element;

          if (child.nodeType === 1) {
            const oldStartTransform = startTransform;

            startTransform = child.getAttribute('transform');

            const childTlist = getTransformList(child as SVGGraphicsElement);

            if (!childTlist) continue;

            const newxlate = svgroot.createSVGTransform();

            newxlate.setTranslate(tx, ty);

            if (childTlist.numberOfItems) {
              childTlist.insertItemBefore(newxlate, 0);
            } else {
              childTlist.appendItem(newxlate);
            }

            const cmd = recalculateDimensions(child);

            if (cmd && !cmd.isEmpty()) {
              batchCmd.addSubCommand(cmd);
            }

            startTransform = oldStartTransform;
          }
        }
      }

      if (gAngle) {
        insertRotation(tlist, rnew);
      }
    }
  } else if (selected.tagName?.toLowerCase?.() === 'clippath') {
    // Combine all transforms into a single matrix
    const transformList = getTransformList(selected as SVGGraphicsElement);

    if (transformList) {
      const matrix = svgedit.math.transformListToTransform(transformList).matrix;

      transformList.clear();

      const newTransform = svgroot.createSVGTransform();

      newTransform.setMatrix(matrix);
      transformList.appendItem(newTransform);
    }
  } else {
    // NON-GROUP ELEMENT HANDLING
    const box = getBBox(selected as SVGElement, { ignoreTransform: true });
    let oldRotateMatrix: DOMMatrix | undefined;

    if (!box && selected.tagName !== 'path') return null;

    let m = svgroot.createSVGMatrix();
    const angle = getRotationAngle(selected as SVGElement);

    let oldcenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    let newCenter = { ...oldcenter };
    let newCenterWithRotate = { ...oldcenter };

    if (angle) {
      newCenterWithRotate = svgedit.math.transformPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
        svgedit.math.transformListToTransform(tlist).matrix,
      );
      for (let i = 0; i < tlist.numberOfItems; ++i) {
        const xform = tlist.getItem(i);

        if (xform.type === 4) {
          oldRotateMatrix = xform.matrix;
          tlist.removeItem(i);
          break;
        }
      }
      newCenter = svgedit.math.transformPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
        svgedit.math.transformListToTransform(tlist).matrix,
      );

      // Hack: in beam studio the center is defined by bbox and the last M matrix
      if (tlist.numberOfItems > 0) {
        const lastM = tlist.getItem(tlist.numberOfItems - 1);

        if (lastM.type === 1) {
          oldcenter = svgedit.math.transformPoint(oldcenter.x, oldcenter.y, lastM.matrix);
        }
      }
    }

    // Operation classification: 2=translate, 3=scale, 4=rotate, 1=matrix absorption
    let operation = 0;
    const N = tlist.numberOfItems;

    // Handle userSpaceOnUse gradients
    if (!svgedit.browser.isWebkit()) {
      const fill = selected.getAttribute('fill');

      if (fill && fill.indexOf('url(') === 0) {
        const paint = svgedit.utilities.getRefElem(fill);
        let type = 'pattern';

        if (paint.tagName !== type) type = 'gradient';

        const attrVal = paint.getAttribute(`${type}Units`);

        if (attrVal === 'userSpaceOnUse') {
          m = svgedit.math.transformListToTransform(tlist).matrix;

          const gtlist = getTransformList(paint);
          const gmatrix = svgedit.math.transformListToTransform(gtlist).matrix;

          m = svgedit.math.matrixMultiply(m, gmatrix);

          const mStr = `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].join(',')})`;

          paint.setAttribute(`${type}Transform`, mStr);
        }
      }
    }

    // Scale: [M][T][S][T] pattern
    if (
      N >= 3 &&
      tlist.getItem(N - 2).type === 3 &&
      tlist.getItem(N - 3).type === 2 &&
      tlist.getItem(N - 1).type === 2
    ) {
      operation = 3;
      m = svgedit.math.transformListToTransform(tlist, N - 3, N - 1).matrix;
      tlist.removeItem(N - 1);
      tlist.removeItem(N - 2);
      tlist.removeItem(N - 3);
    } else if (N === 4 && tlist.getItem(N - 1).type === 1) {
      // Skewed element resize: [T][S][-T][M]
      operation = 3;
      m = svgedit.math.transformListToTransform(tlist).matrix;

      const e2t = svgroot.createSVGTransform();

      e2t.setMatrix(m);
      tlist.clear();
      tlist.appendItem(e2t);
      m = svgroot.createSVGMatrix();
    } else if ((N === 1 || (N > 1 && tlist.getItem(1).type !== 3)) && tlist.getItem(0).type === 2) {
      // Translate: [T1][M] → [M][T2]
      operation = 2;

      const oldxlate = tlist.getItem(0).matrix;
      const meq = svgedit.math.transformListToTransform(tlist, 1).matrix;
      const meqInv = meq.inverse();

      m = svgedit.math.matrixMultiply(meqInv, oldxlate, meq);
      tlist.removeItem(0);
    } else if (N >= 1 && tlist.getItem(0).type === 1) {
      // Matrix imposition: simplify if possible
      const matrix = svgedit.math.transformListToTransform(tlist).matrix;

      if (['line', 'path', 'polygon', 'polyline'].includes(selected.tagName)) {
        // Absorb matrix into point-based element attributes
        m = svgedit.math.transformListToTransform(tlist).matrix;

        if (selected.tagName === 'line') {
          changes = getAttrs(selected, ['x1', 'y1', 'x2', 'y2']);
        } else if (selected.tagName === 'path') {
          changes.d = selected.getAttribute('d');
        } else {
          // polyline or polygon
          changes.points = selected.getAttribute('points');

          if (changes.points) {
            const list = (selected as SVGPolygonElement).points;
            const len = list.numberOfItems;

            changes.points = Array.from({ length: len }).map(() => ({ x: 0, y: 0 }));
            for (let i = 0; i < len; ++i) {
              const pt = list.getItem(i);

              changes.points[i] = { x: pt.x, y: pt.y };
            }
          }
        }

        operation = 1;
        tlist.clear();
      } else if (isNegligible(matrix.b) && isNegligible(matrix.c)) {
        operation = 3;
        m = matrix;
        tlist.removeItem(0);
      }
    }

    // Operation 0 → 4: rotation only (no absorption possible)
    if (operation === 0) {
      operation = 4;

      if (angle) {
        const newRot = svgroot.createSVGTransform();

        if (selected.tagName === 'text') {
          // Text: remap element and tspans through extrat
          const curM = svgedit.math.transformListToTransform(tlist).matrix;

          newRot.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);

          const extrat = svgedit.math.matrixMultiply(curM.inverse(), newRot.matrix.inverse(), oldRotateMatrix, curM);

          remapTspanChildren(selected, extrat, batchCmd);
          remapElement(selected, changes, extrat);
        } else {
          // Non-text: adjust M so [R_new][M'] = [R_old][M] => M' = R_new^-1 * R_old * M
          const curM = svgedit.math.transformListToTransform(tlist).matrix;

          newRot.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);

          const mPrime = svgedit.math.matrixMultiply(newRot.matrix.inverse(), oldRotateMatrix, curM);

          tlist.clear();

          const newM = svgroot.createSVGTransform();

          newM.setMatrix(mPrime);
          tlist.appendItem(newM);
        }

        insertRotation(tlist, newRot);
      }

      if (tlist.numberOfItems === 0) {
        selected.removeAttribute('transform');
      }

      return null;
    }

    // Remap element attributes through the matrix
    if (operation === 1 || operation === 2 || operation === 3) {
      remapElement(selected, changes, m);
    }

    // Post-processing: re-insert rotation at the correct center
    if (operation === 2) {
      if (angle) {
        if (!svgedit.math.hasMatrixTransform(tlist) && selected.tagName !== 'text') {
          newCenter = {
            x: oldcenter.x + m.e,
            y: oldcenter.y + m.f,
          };
        }

        const newRot = svgroot.createSVGTransform();

        newRot.setRotate(angle, newCenter.x, newCenter.y);
        insertRotation(tlist, newRot);
      }

      // Translate tspan children for text elements
      if (selected.tagName === 'text') {
        remapTspanChildren(selected, m, batchCmd);
      }
    } else if (operation === 1 && angle) {
      // Point-based element with rotation: absorb M, re-insert R at new center
      const rold =
        oldRotateMatrix ||
        (() => {
          const roldt = svgroot.createSVGTransform();

          roldt.setRotate(angle, oldcenter.x, oldcenter.y);

          return roldt.matrix;
        })();
      const rnew = svgroot.createSVGTransform();

      rnew.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);

      const extrat = svgedit.math.matrixMultiply(rnew.matrix.inverse(), rold);

      remapElement(selected, changes, extrat);
      insertRotation(tlist, rnew);
    } else if (operation === 3 && angle) {
      // Scale with rotation: [Rold][M][T][S][-T] → [Rnew][M][Tr]
      const curM = svgedit.math.transformListToTransform(tlist).matrix;
      const roldt = svgroot.createSVGTransform();

      roldt.setRotate(angle, oldcenter.x, oldcenter.y);

      const rold = oldRotateMatrix || roldt.matrix;
      const rnew = svgroot.createSVGTransform();

      rnew.setRotate(angle, newCenterWithRotate.x, newCenterWithRotate.y);

      const rnewInv = rnew.matrix.inverse();
      const mInv = curM.inverse();
      const extrat = svgedit.math.matrixMultiply(mInv, rnewInv, rold, curM);

      if (selected.tagName === 'text') {
        remapTspanChildren(selected, extrat, batchCmd);
      }

      remapElement(selected, changes, extrat);

      if (angle) {
        insertRotation(tlist, rnew);
      }
    }
  }

  // Clean up empty transform list
  if (tlist.numberOfItems === 0) {
    selected.removeAttribute('transform');
  }

  if (!selected.getAttribute('data-tempgroup')) {
    batchCmd.addSubCommand(new ChangeElementCommand(selected, initial!));
  }

  return batchCmd;
};
