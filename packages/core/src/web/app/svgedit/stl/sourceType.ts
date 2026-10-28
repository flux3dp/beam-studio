import { STL_ATTR } from './constants';

/** Read only the retained SVG source tag without loading the three.js extrusion pipeline. */
export const getExtrusionSourceTagName = (elem: Element): null | string => {
  const raw = elem.getAttribute(STL_ATTR.source);

  if (!raw) return null;

  try {
    const { markup } = JSON.parse(raw) as { markup?: unknown };

    if (typeof markup !== 'string' || !markup) return null;

    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
      'image/svg+xml',
    );

    return doc.documentElement.firstElementChild?.tagName.toLowerCase() ?? null;
  } catch {
    return null;
  }
};
