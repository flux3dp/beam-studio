import * as paper from 'paper';

import { CanvasElements } from '@core/app/constants/canvasElements';
import { getTransformList } from '@core/app/svgedit/transform/transformlist';
import { findDefs } from '@core/app/svgedit/utils/findDef';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

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

  const tlist = getTransformList(elem as SVGGraphicsElement);

  if (tlist && tlist.numberOfItems) {
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

const getOwnMatrix = (elem: Element): null | SVGMatrix => {
  const tlist = getTransformList(elem as SVGGraphicsElement);

  return tlist && tlist.numberOfItems > 0 ? svgCanvas.transformListToTransform(tlist).matrix : null;
};

// clip-path is resolved in the coordinate system established by the element's own transform, so
// whenever that transform ends up baked into the geometry the clip path has to follow it.
const transformClipPath = (clipPath: paper.PathItem, matrix: null | SVGMatrix): paper.PathItem => {
  if (!matrix) {
    return clipPath;
  }

  const { a, b, c, d, e, f } = matrix;
  const cloned = clipPath.clone({ insert: false });

  cloned.transform(new paper.Matrix(a, b, c, d, e, f));

  return cloned;
};

// Bounding box comparisons need some slack, otherwise geometry that sits exactly on the clip path
// border (very common: the clip path is the artboard) is treated as being outside of it.
const getEpsilon = (bounds: paper.Rectangle) => Math.max(bounds.width, bounds.height, 1) * 1e-6;

// An axis aligned rectangle fills its own bounding box, which makes bounding box tests exact.
// This is by far the most common clip path shape.
const isRectLike = (clipPath: paper.PathItem) => {
  const boundsArea = clipPath.bounds.width * clipPath.bounds.height;
  const { area } = clipPath as paper.CompoundPath | paper.Path;

  return boundsArea > 0 && Math.abs(Math.abs(area) - boundsArea) <= boundsArea * 1e-6;
};

// One point per subpath: a subpath that does not cross the clip outline is entirely inside or
// entirely outside of it, so a single point per subpath decides.
const getProbePoints = (obj: paper.PathItem): paper.Point[] => {
  const paths = (obj instanceof paper.Path ? [obj] : obj.children) as Array<paper.Path | undefined>;

  return paths
    .filter((path) => path?.segments?.length)
    .map((path) => (path!.length > 0 ? path!.getPointAt(path!.length / 2) : path!.firstSegment.point));
};

// Returns true when the object is entirely inside the clip path, ie. the boolean operation would be
// a no-op. Skipping it keeps the original element (id, vector-effect, stroke settings, ...) intact
// and avoids paper.js boolean artifacts on coincident borders.
const isInsideClipPath = (obj: paper.PathItem, clipPath: paper.PathItem, epsilon: number) => {
  if (!clipPath.bounds.expand(epsilon * 2).contains(obj.bounds)) {
    return false;
  }

  if (isRectLike(clipPath)) {
    return true;
  }

  // Bounding box containment is not enough for other shapes: make sure the object does not cross the
  // clip outline and that it sits inside of it rather than in one of its holes. getCrossings (rather
  // than intersects) ignores overlaps, so geometry running along the clip outline still counts as
  // being inside.
  if (obj.getCrossings(clipPath).length > 0) {
    return false;
  }

  const probes = getProbePoints(obj);

  return probes.length > 0 && probes.every((probe) => clipPath.contains(probe));
};

// Cuts an unfilled path down to the parts inside the clip path.
// paper's own stroke clipping (intersect with trace: false -> splitBoolean) walks the crossings
// backwards and splits through CurveLocation objects. When several crossings share a curve the
// earlier locations go stale and their split is silently skipped, so pieces that stick out of the
// clip path survive. Splitting by numeric offset from the end instead is stable: the offsets of the
// remaining head never move.
const clipOpenPath = (path: paper.Path, clipPath: paper.PathItem): paper.Path[] => {
  // Opening a closed path re-roots its parametrization, so get that out of the way before measuring
  if (path.closed) {
    const [location] = path.getCrossings(clipPath);

    if (location) {
      path.splitAt(location);
    }
  }

  const { length } = path;
  const tolerance = Math.max(length, 1) * 1e-9;
  const offsets = path
    .getCrossings(clipPath)
    .map(({ offset }) => offset)
    .filter((offset) => offset > tolerance && offset < length - tolerance)
    .sort((a, b) => b - a);
  const pieces: paper.Path[] = [];
  let head = path;
  let previous = Number.POSITIVE_INFINITY;

  offsets.forEach((offset) => {
    if (previous - offset <= tolerance) {
      return;
    }

    previous = offset;

    const rest = head.splitAt(offset) as null | paper.Path;

    // splitAt hands back the path itself when all it had to do was open it
    if (rest && rest !== head) {
      pieces.push(rest);
    }
  });
  pieces.push(head);

  // Every piece is now entirely inside or entirely outside, so one point per piece decides
  return pieces.reverse().filter((piece) => {
    const point = piece.length > 0 ? piece.getPointAt(piece.length / 2) : piece.firstSegment?.point;

    return !!point && clipPath.contains(point);
  });
};

const clipSubPath = (
  subPath: paper.PathItem,
  clipPath: paper.PathItem,
  isAllFilled: boolean,
  epsilon: number,
): paper.PathItem[] => {
  // Nothing to cut: keep the subpath as it is rather than running it through a boolean operation
  if (isInsideClipPath(subPath, clipPath, epsilon)) {
    return [subPath];
  }

  if (!isAllFilled) {
    return clipOpenPath(subPath as paper.Path, clipPath);
  }

  const result = subPath.intersect(clipPath, { insert: false, trace: true });

  return result.isEmpty() ? [] : [result];
};

const getBBoxByAttr = (elem: Element) => {
  const left = +(elem.getAttribute('x') ?? '');
  const top = +(elem.getAttribute('y') ?? '');
  const width = +(elem.getAttribute('width') ?? '');
  const height = +(elem.getAttribute('height') ?? '');

  return { bottom: top + height, height, left, right: left + width, top, width };
};

interface ClipContext {
  /** The <clipPath> element itself */
  elem: Element;
  /** The united clip path geometry, in the user space of the clipped element */
  item: paper.PathItem;
  /** Selector of the <clipPath> element, ie. `#some-id` */
  selector: string;
}

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
  // null marks a clip path we cannot resolve: the referencing elements are then left unclipped
  const clipPathMap: { [key: string]: ClipContext | null } = {};

  const collectClipShapes = (item: null | paper.Item, out: paper.PathItem[]) => {
    const insert = false;

    if (!item) {
      return;
    }

    if (item instanceof paper.Shape) {
      out.push(item.toPath(insert));
    } else if (item instanceof paper.PathItem) {
      out.push(item.clone({ insert }));
    } else {
      // Clip path content may be wrapped in groups
      item.children?.forEach((child) => collectClipShapes(child, out));
    }
  };

  const getClipPathItem = (elem: Element): null | paper.PathItem => {
    // objectBoundingBox coordinates are fractions of the clipped element bbox, treating them as user
    // space would shrink the clip path to a 1x1 box next to the origin and wipe out the element
    if (elem.getAttribute('clipPathUnits') === 'objectBoundingBox') {
      return null;
    }

    const insert = false;
    const proj = new paper.Project(document.createElement('canvas'));
    const transform = elem.getAttribute('transform') || '';
    const content = Array.from(elem.children).map(getElemString).join('');
    const items = proj.importSVG(`<svg transform="${transform}">${content}</svg>`);
    const shapes: paper.PathItem[] = [];

    collectClipShapes(items, shapes);

    let pathItem: paper.PathItem = paper.PathItem.create('');

    shapes.forEach((objPath) => {
      objPath.closePath();
      pathItem = pathItem.unite(objPath, { insert });
    });

    return pathItem.isEmpty() ? null : pathItem;
  };

  const clip = async (clipCtx: ClipContext, elem: Element, matrix?: null | SVGMatrix) => {
    if (elem.tagName === 'g') {
      const m = updateMatrix(elem, matrix);
      const promises: Array<Promise<void>> = [];

      elem.childNodes.forEach((subElem) => {
        const p = clip(clipCtx, subElem as Element, m);

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
      let obj = items.children[0] as paper.CompoundPath | paper.Path | paper.Shape | undefined;

      if (obj instanceof paper.Shape) {
        obj = obj.toPath();
      }

      if (!obj) {
        // paper could not import the element, leave it unclipped rather than dropping it
        return;
      }

      // Top level elements (matrix === undefined) keep their own transform, and importSVG bakes it
      // into the geometry above, so the clip path has to be moved to the same coordinate system
      const clipPath = matrix === undefined ? transformClipPath(clipCtx.item, getOwnMatrix(elem)) : clipCtx.item;
      const epsilon = getEpsilon(clipPath.bounds);

      if (!obj.bounds.intersects(clipPath.bounds, epsilon)) {
        elem.remove();

        return;
      }

      if (isInsideClipPath(obj, clipPath, epsilon)) {
        return;
      }

      // Detached clones: paper inserts boolean results next to their source path, and when the source
      // is a child of a CompoundPath the parent absorbs the result children and hands back an empty
      // item, ie. the whole subpath is lost. A parentless source has no owner to insert next to.
      const subPaths = (obj instanceof paper.Path ? [obj] : (obj.children as paper.PathItem[])).map((child) =>
        child.clone({ insert: false }),
      );
      const resPath = new paper.CompoundPath('');

      // A fresh CompoundPath carries the paper defaults (no fill, no stroke) and would export as an
      // invisible path, so the source style has to be carried over explicitly
      resPath.copyAttributes(obj, true);
      subPaths.forEach((subPath) => {
        if (isAllFilled) {
          subPath.closePath();
        }

        clipSubPath(subPath, clipPath, isAllFilled, epsilon).forEach((piece) => resPath.addChild(piece));
      });

      if (resPath.isEmpty()) {
        elem.remove();

        return;
      }

      resPath.fillColor = items.fillColor;
      elem.replaceWith(resPath.exportSVG());
    } else if (elem.tagName === 'image') {
      const imgSrc = elem.getAttribute('xlink:href');
      const clipPath = clipCtx.elem;

      if (!imgSrc) {
        return;
      }

      // firstChild would be the whitespace text node for pretty printed svg
      const clipRect = clipPath.firstElementChild as null | SVGRectElement;

      if (clipRect?.tagName !== 'rect') {
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
        // A top level element still carries its own transform, the crop is expressed in the clip path
        // space so both have to be kept
        const ownMatrix = matrix === undefined ? getOwnMatrix(elem) : null;

        elem.setAttribute('transform', ownMatrix ? `${matrix2String(ownMatrix)} ${clipTransform}` : clipTransform);
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

        elem.setAttribute('data-clip-path', clipCtx.selector);
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

      // The symbol content gets baked into `m`, so for a top level use (whose own transform is part
      // of `m`) the clip path has to be moved along with it
      const subCtx = matrix === undefined ? { ...clipCtx, item: transformClipPath(clipCtx.item, m) } : clipCtx;
      const cloned = symbol.cloneNode(true) as Element;
      const promises: Array<Promise<void>> = [];

      cloned.childNodes.forEach((subElem) => {
        const p = clip(subCtx, subElem as Element, m);

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

      const item = getClipPathItem(clipPathElem);

      clipPathMap[clipPathKey] = item ? { elem: clipPathElem, item, selector: clipPathSelector } : null;
    }

    const clipCtx = clipPathMap[clipPathKey];
    const cloned = elem.cloneNode(true) as Element;
    // clip() replaces and removes elements through their parent, so the clone needs one while it is
    // being worked on. Without it a clipped top level path or image would silently stay unclipped.
    const holder = document.createDocumentFragment();

    holder.appendChild(cloned);

    // A clip path we cannot resolve (unsupported content, objectBoundingBox units, ...) leaves the
    // element unclipped: dropping the clip-path attribute is far better than clipping everything away
    if (clipCtx) {
      await clip(clipCtx, cloned);
    }

    // Note: data-clip-path is intentionally kept, a <use> with inner clip paths re-queues itself and
    // reads its selector back from it
    const results = Array.from(holder.children);

    results.forEach((result) => result.removeAttribute('clip-path'));

    const { nextSibling, parentElement } = elem;

    newElems.push(...results);
    parentElement?.insertBefore(holder, elem);
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
        p = findDefs();
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
