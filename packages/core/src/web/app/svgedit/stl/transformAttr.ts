import type { StlTransform } from '@core/app/stores/stlStore';

import { STL_ATTR } from './constants';

/**
 * What `data-stl-transform` carries: the object's current transform and the one it was imported
 * with, both of which are frontend state that cannot be recovered from the matrix.
 */
export interface StlTransformAttr {
  initialTransform: StlTransform;
  transform: StlTransform;
}

const isTriple = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every((n) => typeof n === 'number' && Number.isFinite(n));

const isTransform = (value: any): value is StlTransform =>
  Boolean(value) &&
  isTriple(value.position) &&
  isTriple(value.rotation) &&
  isTriple(value.scale) &&
  Array.isArray(value.flip) &&
  value.flip.length === 3 &&
  value.flip.every((f: unknown) => typeof f === 'boolean');

export const serializeStlTransform = ({ initialTransform, transform }: StlTransformAttr): string =>
  JSON.stringify({ initialTransform, transform });

/**
 * Read the attribute back. Returns null when it is missing or does not describe a full transform —
 * the caller decides what to do rather than getting a silently wrong object placement.
 */
export const parseStlTransform = (elem: Element): null | StlTransformAttr => {
  const raw = elem.getAttribute(STL_ATTR.transform);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StlTransformAttr>;

    if (!isTransform(parsed?.transform)) return null;

    return {
      // an older file may predate the reset buttons; falling back to the current transform means
      // "reset does nothing" rather than "reset teleports the object"
      initialTransform: isTransform(parsed.initialTransform) ? parsed.initialTransform : parsed.transform,
      transform: parsed.transform,
    };
  } catch {
    return null;
  }
};
