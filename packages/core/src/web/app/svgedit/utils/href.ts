import NS from '@core/app/constants/namespaces';

// TODO: replace svgedit.utilities.getHref, svgedit.utilities.setHref with this file
/**
 * Function: getHref
 * Returns the given element's xlink:href value
 * @param elem
 * @returns
 */
export const getHref = (elem: SVGElement): null | string => {
  return elem.getAttributeNS(NS.XLINK, 'href');
};

/**
 * Function: setHref
 * Sets the given element's xlink:href value
 * @param elem
 * @returns
 */
export const setHref = (elem: SVGElement, val: string): void => {
  elem.setAttributeNS(NS.XLINK, 'href', val);
};

export default {
  getHref,
  setHref,
};
