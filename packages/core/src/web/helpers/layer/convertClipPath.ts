import * as paper from 'paper';

import { CanvasElements } from '@core/app/constants/canvasElements';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const getElemString = (elem: Element) => {
  if (elem.tagName === 'rect' && elem.getAttribute('rx')) {
    const cloned = elem.cloneNode(true) as Element;

    cloned.setAttribute('ry', elem.getAttribute('rx')!);

    return cloned.outerHTML;
  }

  return elem.outerHTML;
};

const checkParent = (
  elem: Element,
): { parent: Element; shouldSkip: false } | { parent?: Element; shouldSkip: true } => {
  if (!elem.isConnected) {
    return { shouldSkip: true };
  }

  if (elem.tagName === 'defs' || ['svg_defs', 'svgcontent'].includes(elem.id)) {
    return { parent: elem, shouldSkip: false };
  }

  if (elem.tagName === 'symbol') {
    return {
      parent: elem,
      shouldSkip: !document.querySelector(`#svgcontent use[*|href="#${elem.id}"]`),
    };
  }

  return checkParent(elem.parentNode as Element);
};

const updateMatrix = (elem: Element, matrix: null | SVGMatrix | undefined, inverse = false): null | SVGMatrix => {
  // Skip transform of top level elem
  if (matrix === undefined) {
    return null;
  }

  const tlist = svgCanvas.getTransformList(elem);

  if (tlist.numberOfItems > 0) {
    if (!inverse) {
      elem.removeAttribute('transform');
    }

    const newMatrix = svgCanvas.transformListToTransform(tlist).matrix;

    if (!matrix) {
      return inverse ? newMatrix.inverse() : newMatrix;
    }

    if (inverse) {
      return newMatrix.inverse().multiply(matrix);
    }

    return matrix.multiply(newMatrix);
  }

  return matrix;
};

const matrix2String = (m: null | SVGMatrix) => (m ? `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})` : '');

const getBBoxByAttr = (elem: Element) => {
  const left = +(elem.getAttribute('x') ?? '');
  const top = +(elem.getAttribute('y') ?? '');
  const width = +(elem.getAttribute('width') ?? '');
  const height = +(elem.getAttribute('height') ?? '');

  return { bottom: top + height, height, left, right: left + width, top, width };
};

// Note:
// When importing svg files, fluxsvg only handles clip-path attributes with url and ignore those with basic shapes
// Image is clipped once impoerted; however, passthrough may create a rect clip-path to image elems
// Clip path loop will cause error and stop at importing step
const convertClipPath = async (): Promise<() => void> => {
  let revert = () => {};
  const clippedElems = Array.from(
    document.querySelectorAll('#svgcontent *[clip-path*="url"], #svg_defs *[clip-path*="url"]'),
  );

  if (clippedElems.length === 0) {
    return revert;
  }

  const newElems: Element[] = [];
  const oldElems: Array<{ elem: Element; nextSibling: ChildNode | null; parentElement: Element | null }> = [];
  const clipPathMap: { [key: string]: paper.PathItem } = {};

  const getClipPathItem = (elem: Element) => {
    const insert = false;
    const proj = new paper.Project(document.createElement('canvas'));
    const transform = elem.getAttribute('transform') || '';
    const items = proj.importSVG(`<svg transform="${transform}">${elem.innerHTML}</svg>`);
    let pathItem: paper.PathItem = paper.PathItem.create('');

    for (let i = 0; i < items.children.length; i += 1) {
      const obj = items.children[i] as paper.CompoundPath | paper.Path | paper.Shape;
      const objPath = obj instanceof paper.Shape ? obj.toPath(insert) : obj.clone({ insert });

      objPath.closePath();
      pathItem = pathItem.unite(objPath, { insert });
    }

    return pathItem;
  };

  const clip = async (clipPathKey: string, elem: Element, matrix?: null | SVGMatrix) => {
    if (elem.tagName === 'g') {
      const m = updateMatrix(elem, matrix);
      const promises: Array<Promise<void>> = [];

      elem.childNodes.forEach((subElem) => {
        const p = clip(clipPathKey, subElem as Element, m);

        promises.push(p);
      });
      await Promise.all(promises);
    } else if (CanvasElements.basicPaths.includes(elem.tagName)) {
      const { isAllFilled } = svgCanvas.calcElemFilledInfo(elem);

      if (matrix) {
        const m = updateMatrix(elem, matrix);

        elem.setAttribute('transform', matrix2String(m));
      }

      const proj = new paper.Project(document.createElement('canvas'));
      const items = proj.importSVG(`<svg>${getElemString(elem)}</svg>`);
      let obj = items.children[0] as paper.CompoundPath | paper.Path | paper.Shape;

      if (obj instanceof paper.Shape) {
        obj = obj.toPath();
      }

      let resPath: paper.PathItem;
      const clipPath = clipPathMap[clipPathKey];

      if (obj instanceof paper.Path) {
        if (isAllFilled) {
          obj.closePath();
        }

        resPath = obj.intersect(clipPath, { trace: isAllFilled });
      } else {
        let l = obj.children.length;

        resPath = new paper.CompoundPath('');
        for (let i = 0; i < obj.children.length; i += 1) {
          const subPath = obj.children[i] as paper.PathItem;

          if (isAllFilled) {
            subPath.closePath();
          }

          resPath.addChild(subPath.intersect(clipPath, { insert: false, trace: isAllFilled }));

          if (obj.children.length > l) {
            // Sometimes obj.children grows with insert: false, skip added items
            i += obj.children.length - l;
            l = obj.children.length;
          }
        }
      }

      resPath.fillColor = items.fillColor;
      elem.replaceWith(resPath.exportSVG());
    } else if (elem.tagName === 'image') {
      const imgSrc = elem.getAttribute('xlink:href');
      const clipPath = document.querySelector(clipPathKey.split('-')[1]);

      if (!clipPath || !imgSrc) {
        return;
      }

      const clipRect = clipPath.firstChild as SVGRectElement;

      if (clipRect.tagName !== 'rect') {
        return;
      }

      const m0 = updateMatrix(elem, matrix);
      const m = updateMatrix(clipPath, m0, true);
      const transformPoint = (x: number, y: number) => {
        if (!m) {
          return { x, y };
        }

        const { a, b, c, d, e, f } = m;
        const newX = a * x + c * y + e;
        const newY = b * x + d * y + f;

        return { x: newX, y: newY };
      };

      // Calculate image area
      const bBox = getBBoxByAttr(elem);
      const topLeft = transformPoint(bBox.left, bBox.top);
      const topRight = transformPoint(bBox.right, bBox.top);
      const bottomLeft = transformPoint(bBox.left, bBox.bottom);
      const bottomRight = transformPoint(bBox.right, bBox.bottom);
      const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
      const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
      const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
      const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

      const clipBBox = getBBoxByAttr(clipRect);

      if (clipBBox.left > maxX || clipBBox.right < minX || clipBBox.top > maxY || clipBBox.bottom < minY) {
        // Completely outside
        elem.remove();

        return;
      }

      if (clipBBox.left <= minX && clipBBox.right >= maxX && clipBBox.top <= minY && clipBBox.bottom >= maxY) {
        // Completely inside
        if (m0) {
          elem.setAttribute('transform', matrix2String(m0));
        }

        return;
      }

      // Calculate crop area
      const cropLeft = Math.max(clipBBox.left, minX);
      const cropTop = Math.max(clipBBox.top, minY);
      const cropRight = Math.min(clipBBox.right, maxX);
      const cropBottom = Math.min(clipBBox.bottom, maxY);

      // Clip & draw image
      const canvas = document.createElement('canvas');

      canvas.width = maxX - minX;
      canvas.height = maxY - minY;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return;
      }

      const region = new Path2D();

      region.rect(cropLeft - minX, cropTop - minY, cropRight - cropLeft, cropBottom - cropTop);
      ctx.clip(region);

      const img = new Image();

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = imgSrc;
      });
      ctx.save();
      ctx.translate(-minX, -minY);

      if (m) {
        ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      }

      ctx.drawImage(img, 0, 0, img.width, img.height, bBox.left, bBox.top, bBox.width, bBox.height);
      ctx.restore();

      const base64 = canvas.toDataURL('image/png');

      elem.setAttribute('xlink:href', base64);
      elem.setAttribute('x', minX.toString());
      elem.setAttribute('y', minY.toString());
      elem.setAttribute('width', (maxX - minX).toString());
      elem.setAttribute('height', (maxY - minY).toString());

      const clipTransform = clipPath.getAttribute('transform');

      if (clipTransform) {
        elem.setAttribute('transform', clipTransform);
      }

      elem.removeAttribute('origImage');
    } else if (elem.tagName === 'use') {
      const symbolId = elem.getAttribute('xlink:href')?.replace('#', '') || '';
      const symbol = document.getElementById(symbolId);

      if (!symbol) {
        // Should not happen
        elem.remove();

        return;
      }

      let m = updateMatrix(elem, matrix || null);
      const subClipped = symbol.querySelectorAll('*[clip-path*="url"]');

      if (clippedElems.length > 0 && subClipped.length > 0) {
        if (m) {
          elem.setAttribute('transform', matrix2String(m));
        }

        elem.setAttribute('data-clip-path', clipPathKey.split('-')[1]);
        clippedElems.unshift(elem);

        return;
      }

      const offset = svgCanvas.transformListToTransform(null).matrix;

      offset.e = +(elem.getAttribute('x') ?? '');

      if (offset.e !== 0) {
        elem.setAttribute('x', '0');
      }

      offset.f = +(elem.getAttribute('y') ?? '');

      if (offset.f !== 0) {
        elem.setAttribute('y', '0');
      }

      m = m ? m.multiply(offset) : offset;

      const cloned = symbol.cloneNode(true) as Element;
      const promises: Array<Promise<void>> = [];

      cloned.childNodes.forEach((subElem) => {
        const p = clip(clipPathKey, subElem as Element, m);

        promises.push(p);
      });
      await Promise.all(promises);

      const { nextSibling, parentElement } = symbol;

      oldElems.unshift({ elem: symbol, nextSibling, parentElement });
      newElems.push(cloned);
      parentElement?.insertBefore(cloned, symbol);
      symbol.remove();
    }
  };

  while (clippedElems.length > 0) {
    const elem = clippedElems.pop();

    if (!elem) {
      break;
    }

    const { parent, shouldSkip } = checkParent(elem);

    if (shouldSkip) {
      continue;
    }

    const clipPathSelector =
      elem.tagName === 'use'
        ? elem.getAttribute('data-clip-path')
        : svgCanvas.getUrlFromAttr(elem.getAttribute('clip-path'));
    // Add parent id to avoid collision clip path id in duplicated import process
    const clipPathKey = `${parent.id}-${clipPathSelector}`;

    if (!(clipPathKey in clipPathMap)) {
      const clipPathElem = parent.querySelector(clipPathSelector);

      if (!clipPathElem) {
        continue;
      }

      if (
        clippedElems.length > 0 &&
        (clipPathElem.hasAttribute('clip-path') || !!clipPathElem.querySelector('*[clip-path*="url"]'))
      ) {
        // Should handle inner clip-path first
        clippedElems.unshift(elem);
        continue;
      }

      clipPathMap[clipPathKey] = getClipPathItem(clipPathElem);
    }

    const cloned = elem.cloneNode(true) as Element;

    await clip(clipPathKey, cloned);
    cloned.removeAttribute('clip-path');

    const { nextSibling, parentElement } = elem;

    newElems.push(cloned);
    parentElement?.insertBefore(cloned, elem);
    oldElems.unshift({ elem, nextSibling, parentElement });
    elem.remove();
  }

  // Remove all clipPath elements
  const clipPathElems = document.querySelectorAll('#svgcontent clipPath, #svg_defs clipPath');

  for (let i = 0; i < clipPathElems.length; i += 1) {
    const clipPathElem = clipPathElems[i];
    const { nextSibling, parentElement } = clipPathElem;

    oldElems.unshift({ elem: clipPathElem, nextSibling, parentElement });
    clipPathElem.remove();
  }

  revert = () => {
    oldElems.forEach(({ elem, nextSibling, parentElement }) => {
      if (!parentElement) {
        return;
      }

      let p = parentElement as Element;

      // defs may be removed when generating thumbnail
      if (!p.isConnected && p.tagName === 'defs') {
        p = svgCanvas.findDefs();
      }

      if (nextSibling) {
        p.insertBefore(elem, nextSibling);
      } else {
        p.appendChild(elem);
      }
    });
    newElems.forEach((elem) => elem.remove());
  };

  return revert;
};

export default convertClipPath;
