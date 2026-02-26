import { match } from 'ts-pattern';

import NS from '@core/app/constants/namespaces';

import { getTransformList } from '../transform/transformlist';

const getTextBBox = (text: SVGTextElement): DOMRect => {
  let emptyContextIndices = [];

  if (text.childElementCount > 0) {
    for (let i = 0; i < text.children.length; i += 1) {
      if (text.children[i].textContent === '') {
        emptyContextIndices.push(i);
        text.children[i].textContent = 'a';
      }
    }
  } else if (text.textContent === '') {
    emptyContextIndices.push(0);
    text.textContent = 'a';
  }

  const bbox = text.getBBox();

  if (text.childElementCount > 0) {
    for (let i = 0; i < emptyContextIndices.length; i += 1) {
      let j = emptyContextIndices[i];

      text.children[j].textContent = '';
    }
  } else if (emptyContextIndices.length > 0) {
    text.textContent = '';
  }

  if (text.getAttribute('data-fit-text') === 'true') {
    const isVertical = text.getAttribute('data-verti') === 'true';

    if (isVertical) {
      let y = Number.parseFloat(text.getAttribute('y') || '0');
      const height = Number.parseFloat(text.getAttribute('data-fit-text-size') || '0');

      bbox.y = y;
      bbox.height = height;
    } else {
      let x = Number.parseFloat(text.getAttribute('x') || '0');
      const width = Number.parseFloat(text.getAttribute('data-fit-text-size') || '0');
      const textAnchor = text.getAttribute('data-fit-text-align');

      if (textAnchor === 'middle') {
        x -= width / 2;
      } else if (textAnchor === 'end') {
        x -= width;
      }

      bbox.x = x;
      bbox.width = width;
    }
  }

  return bbox;
};

const getUseBBoxByDataXform = (elem: SVGUseElement): { height: number; width: number; x: number; y: number } => {
  const xform = elem.getAttribute('data-xform');

  if (!xform) return elem.getBBox();

  const x = Number.parseFloat(elem.getAttribute('x') || '0');
  const y = Number.parseFloat(elem.getAttribute('y') || '0');

  const bbox: Partial<{ height: number; width: number; x: number; y: number }> = {};

  xform.split(' ').forEach((pair) => {
    const [key, value] = pair.split('=');

    if (value === undefined) return;

    const floatValue = Number.parseFloat(value);

    if (Number.isNaN(floatValue)) return;

    match(key)
      .with('x', () => {
        bbox.x = floatValue + x;
      })
      .with('y', () => {
        bbox.y = floatValue + y;
      })
      .with('width', () => {
        bbox.width = floatValue;
      })
      .with('height', () => {
        bbox.height = floatValue;
      })
      .otherwise(() => {
        // do nothing
      });
  });

  return bbox as { height: number; width: number; x: number; y: number };
};

// TODO: This is problematic with large stroke-width and, for example, a single horizontal line. The calculated BBox extends way beyond left and right sides.
const getStrokeOffsetForBBox = (elem: Element): number => {
  if (elem.nodeType !== 1) return 0;

  if (elem.getAttribute('stroke') === 'none') return 0;

  const strokeWidth = elem.getAttribute('stroke-width');

  if (!strokeWidth) return 0;

  const value = Number(strokeWidth);

  if (Number.isNaN(value)) return 0;

  return value / 2;
};

interface GetBBoxOptions {
  ignoreRotation?: boolean;
  ignoreTransform?: boolean;
  withStroke?: boolean;
}

/**
 * Gets the bounding box of an SVG element, with options to include or ignore transforms.
 * @param elem - the element to get the bounding box for.
 * @param opts.ignoreRotation - Only take effect when `opts.ignoreTransform` is false. Whether to ignore rotation transforms when calculating the bounding box.
 * @param opts.ignoreTransform - whether to ignore transforms when calculating the bounding box.
 * @param opts.withStroke - whether to include the stroke width in the bounding box calculation.
 * @returns the bounding box of the element, with or without transforms applied based on the options.
 */
export const getBBox = (
  elem: SVGElement,
  { ignoreRotation = true, ignoreTransform = false, withStroke = false }: GetBBoxOptions = {},
): { height: number; width: number; x: number; y: number } => {
  const { tagName } = elem;
  let bbox: { height: number; width: number; x: number; y: number };

  try {
    bbox = match(tagName)
      .with('use', () => getUseBBoxByDataXform(elem as SVGUseElement))
      .with('text', () => getTextBBox(elem as SVGTextElement))
      .otherwise(() => (elem as SVGGraphicsElement).getBBox());
  } catch (error) {
    console.error('Error in getBBox for element', elem, error);
    try {
      bbox = (elem as SVGGraphicsElement).getBBox();
    } catch (error) {
      console.error('Error in getBBox fallback for element', elem, error);

      return { height: 0, width: 0, x: 0, y: 0 };
    }
  }

  if (withStroke) {
    const offset = getStrokeOffsetForBBox(elem);

    bbox.x -= offset;
    bbox.y -= offset;
    bbox.width += offset * 2;
    bbox.height += offset * 2;
  }

  if (!ignoreTransform) {
    const tlist = getTransformList(elem as SVGGraphicsElement);
    const svg = document.createElementNS(NS.SVG, 'svg');

    if (tlist) {
      let matrix = svg.createSVGMatrix();
      let lastRotationIdx = -1;

      if (ignoreRotation) {
        for (let i = 0; i < tlist.numberOfItems; i++) {
          if (tlist.getItem(i).type === 4) {
            lastRotationIdx = i;
            break;
          }
        }
      }

      for (let i = tlist.numberOfItems - 1; i > lastRotationIdx; i--) {
        if (ignoreRotation && i === lastRotationIdx) {
          break;
        }

        matrix = tlist.getItem(i).matrix.multiply(matrix);
      }

      const { maxX, maxY, minX, minY } = [
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y],
        [bbox.x, bbox.y + bbox.height],
        [bbox.x + bbox.width, bbox.y + bbox.height],
      ]
        .map((point) => {
          const svgPoint = svg.createSVGPoint();

          svgPoint.x = point[0];
          svgPoint.y = point[1];

          const transformedPoint = svgPoint.matrixTransform(matrix);

          return [transformedPoint.x, transformedPoint.y];
        })
        .reduce(
          (acc, point) => {
            const [x, y] = point;

            if (x < acc.minX) acc.minX = x;

            if (y < acc.minY) acc.minY = y;

            if (x > acc.maxX) acc.maxX = x;

            if (y > acc.maxY) acc.maxY = y;

            return acc;
          },
          { maxX: -Infinity, maxY: -Infinity, minX: Infinity, minY: Infinity },
        );

      bbox.x = minX;
      bbox.y = minY;
      bbox.width = maxX - minX;
      bbox.height = maxY - minY;
    }
  }

  return {
    height: bbox.height,
    width: bbox.width,
    x: bbox.x,
    y: bbox.y,
  };
};

export const getBBoxFromElements = (
  elems: SVGGraphicsElement[],
  getBBoxOptions?: GetBBoxOptions,
): { height: number; width: number; x: number; y: number } => {
  if (!elems.length) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }

  const { maxX, maxY, minX, minY } = elems.reduce(
    (acc, elem) => {
      const bbox = getBBox(elem, getBBoxOptions);

      // If the element has no size, ignore it. (avoid min x and y to be 0)
      if (bbox.width === 0 && bbox.height === 0) return acc;

      if (bbox.x < acc.minX) acc.minX = bbox.x;

      if (bbox.y < acc.minY) acc.minY = bbox.y;

      if (bbox.x + bbox.width > acc.maxX) acc.maxX = bbox.x + bbox.width;

      if (bbox.y + bbox.height > acc.maxY) acc.maxY = bbox.y + bbox.height;

      return acc;
    },
    { maxX: -Infinity, maxY: -Infinity, minX: Infinity, minY: Infinity },
  );

  if (maxX === -Infinity || maxY === -Infinity || minX === Infinity || minY === Infinity) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }

  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
};
