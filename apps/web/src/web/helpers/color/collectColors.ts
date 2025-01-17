import getRealSymbol from 'helpers/symbol-helper/getRealSymbol';
import rgbToHex from 'helpers/color/rgbToHex';

const parseColorString = (color: string): string => {
  if (color.startsWith('rgb(')) return rgbToHex(color);
  return color;
};

const isHex = (color: string): boolean => /^#([0-9A-F]{6}|[0-9A-F]{3})$/.test(color);

// TODO: add tests
const colloectColors = (
  element: Element
): {
  [color: string]: { element: Element; attribute: 'fill' | 'stroke'; useElement?: SVGUseElement }[];
} => {
  const colorsTable: {
    [color: string]: {
      element: Element;
      attribute: 'fill' | 'stroke';
      useElement?: SVGUseElement;
    }[];
  } = {};
  const elements: { node: Element; useElement?: SVGUseElement }[] = [{ node: element }];
  while (elements.length > 0) {
    const { node, useElement } = elements.pop();
    const tagName = node?.tagName?.toLowerCase();
    // eslint-disable-next-line no-continue
    if (node?.nodeType !== 1 || ['clippath', 'styles'].includes(tagName)) continue;
    if (['polygon', 'path', 'line', 'rect', 'ellipse', 'circle', 'text'].includes(tagName)) {
      const fill = parseColorString(node.getAttribute('fill') || '#000000').toUpperCase();
      if (fill !== 'none' && isHex(fill)) {
        if (!colorsTable[fill])
          colorsTable[fill] = [{ element: node, attribute: 'fill', useElement }];
        else colorsTable[fill].push({ element: node, attribute: 'fill', useElement });
      }
      const stroke = parseColorString(node.getAttribute('stroke') || 'none').toUpperCase();
      if (stroke !== 'none' && isHex(stroke)) {
        if (!colorsTable[stroke])
          colorsTable[stroke] = [{ element: node, attribute: 'stroke', useElement }];
        else colorsTable[stroke].push({ element: node, attribute: 'stroke', useElement });
      }
    }

    if (tagName === 'use') {
      const symbol = getRealSymbol(node);
      if (symbol) elements.push({ node: symbol, useElement: node as SVGUseElement });
    } else if (node.childNodes?.length > 0) {
      elements.push(
        ...Array.from(node.childNodes, (childNode) => ({
          node: childNode as Element,
          useElement,
        }))
      );
    }
  }

  return colorsTable;
};

export default colloectColors;
