import { todo } from '@core/helpers/is-dev';

import { STL_ATTR } from './constants';

/**
 * Whether the element is the projection rect of an STL 3D object rather than a real 2D rectangle.
 *
 * Use this anywhere that dispatches on `tagName` — a projection rect *is* a `<rect>` and would
 * otherwise be treated as a rectangle by shape conversion, boolean operations and the right panel.
 * Prefer `nodeType === 'stl'` from `selectedElementStore` when the selected element is already
 * available there.
 */
export const isStlProjection = (elem?: Element | null): boolean => Boolean(elem?.getAttribute(STL_ATTR.marker));

todo('If isPlainRect is not used, it may be removed');
/**
 * Whether the element is a real `<rect>` shape, excluding STL projection rects.
 */
export const isPlainRect = (elem?: Element | null): boolean =>
  elem?.tagName.toLowerCase() === 'rect' && !isStlProjection(elem);
