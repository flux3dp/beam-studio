import type { ComponentType } from 'react';
import { createElement } from 'react';

import ReactDomServer from 'react-dom/server';

import { getNPIconByID } from '@core/helpers/api/flux-id';

/** Prefix used for Noun Project shape keys, e.g. `np/12345`. */
export const NP_SHAPE_PREFIX = 'np/';

/** Cache: shapeKey → rendered SVG markup string */
export const svgCache = new Map<string, string>();

/**
 * Loads a shape SVG by key. Must be called before applyElements for that shape.
 *
 * - Built-in shapes (e.g. `basic/icon-heart1`) are loaded via the Element Panel's
 *   dynamic SVG import.
 * - Noun Project shapes (e.g. `np/12345`) are fetched via `getNPIconByID` which
 *   returns a base64-encoded SVG that we read as text.
 */
export const loadShape = async (shapeKey: string): Promise<null | string> => {
  if (!shapeKey) {
    return null;
  }

  if (svgCache.has(shapeKey)) {
    return svgCache.get(shapeKey)!;
  }

  let svgString: string;

  if (shapeKey.startsWith(NP_SHAPE_PREFIX)) {
    const id = shapeKey.slice(NP_SHAPE_PREFIX.length);
    const base64 = await getNPIconByID(id);

    if (!base64) return null;

    const res = await fetch(base64);

    svgString = await res.text();
  } else {
    const module = await import(`@core/app/icons/shape/${shapeKey}.svg`);
    const Component = module.default as ComponentType;

    svgString = ReactDomServer.renderToStaticMarkup(createElement(Component));
  }

  svgCache.set(shapeKey, svgString);

  return svgString;
};
