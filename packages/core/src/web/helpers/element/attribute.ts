export type AttributeMap = Record<string, string>;

const defaultAttributes: AttributeMap = {
  'data-ratiofixed': 'false',
  fill: '#000000',
  'fill-opacity': '1',
  stroke: 'none',
  'stroke-width': '1',
};

export const getAttributeWithDefault = (elem: Element, attribute: string): string => {
  return elem.getAttribute(attribute) ?? defaultAttributes[attribute];
};

export const getAttributes = (elem: Element, attributes: string[]): AttributeMap => {
  return attributes.reduce((acc, attr) => {
    acc[attr] = getAttributeWithDefault(elem, attr);

    return acc;
  }, {} as AttributeMap);
};

export const setAttributes = (elem: Element, attributes: Record<string, null | string>): void => {
  Object.entries(attributes).forEach(([attr, value]) => {
    if (value === null) {
      elem.removeAttribute(attr);
    } else {
      elem.setAttribute(attr, value);
    }
  });
};
