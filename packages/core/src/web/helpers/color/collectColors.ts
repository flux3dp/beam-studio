import rgbToHex from '@core/helpers/color/rgbToHex';
import getRealSymbol from '@core/helpers/symbol-helper/getRealSymbol';

const parseColorString = (color: string): string => {
  if (color.startsWith('rgb(')) {
    return rgbToHex(color);
  }

  return color;
};

const isHex = (color: string): boolean => /^#([0-9A-F]{6}|[0-9A-F]{3})$/.test(color);

// TODO: add tests
const colloectColors = (
  element: Element,
): {
  [color: string]: Array<{ attribute: 'fill' | 'stroke'; element: Element; useElement?: SVGUseElement }>;
} => {
  const colorsTable: {
    [color: string]: Array<{
      attribute: 'fill' | 'stroke';
      element: Element;
      useElement?: SVGUseElement;
    }>;
  } = {};
  const elements: Array<{ node: Element; useElement?: SVGUseElement }> = [{ node: element }];

  while (elements.length > 0) {
    const { node, useElement } = elements.pop();
    const tagName = node?.tagName?.toLowerCase();

    if (node?.nodeType !== 1 || ['clippath', 'styles'].includes(tagName)) {
      continue;
    }

    if (['circle', 'ellipse', 'line', 'path', 'polygon', 'rect', 'text'].includes(tagName)) {
      const fill = parseColorString(node.getAttribute('fill') || '#000000').toUpperCase();

      if (fill !== 'none' && isHex(fill)) {
        if (!colorsTable[fill]) {
          colorsTable[fill] = [{ attribute: 'fill', element: node, useElement }];
        } else {
          colorsTable[fill].push({ attribute: 'fill', element: node, useElement });
        }
      }

      const stroke = parseColorString(node.getAttribute('stroke') || 'none').toUpperCase();

      if (stroke !== 'none' && isHex(stroke)) {
        if (!colorsTable[stroke]) {
          colorsTable[stroke] = [{ attribute: 'stroke', element: node, useElement }];
        } else {
          colorsTable[stroke].push({ attribute: 'stroke', element: node, useElement });
        }
      }
    }

    if (tagName === 'use') {
      const symbol = getRealSymbol(node);

      if (symbol) {
        elements.push({ node: symbol, useElement: node as SVGUseElement });
      }
    } else if (node.childNodes?.length > 0) {
      elements.push(
        ...Array.from(node.childNodes, (childNode) => ({
          node: childNode as Element,
          useElement,
        })),
      );
    }
  }

  return colorsTable;
};

export default colloectColors;
