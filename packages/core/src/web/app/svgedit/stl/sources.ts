import { useStlStore } from '@core/app/stores/stlStore';

import { POINT_CLOUD_ATTR, STL_ATTR } from './constants';

/**
 * The mesh binary of every STL object that still has a projection rect in `svgcontent`, keyed by id.
 *
 * Driven by the DOM rather than by the store so that a deleted (or undone) object never ships its
 * mesh: the rect is what the rest of the app treats as the object's existence. The same map shape
 * feeds both consumers of the binaries — the `stlObjects` payload sent to swiftray (A-3) and .beam
 * block 6 (A-2).
 */
export const getStlSources = (): Record<string, ArrayBuffer> => {
  const { objects } = useStlStore.getState();
  const result: Record<string, ArrayBuffer> = {};

  document.querySelectorAll(`#svgcontent [${STL_ATTR.marker}]`).forEach(({ id }) => {
    const object = objects[id];

    if (object?.kind === 'photo' || object?.kind === 'point-cloud') return;

    if (object?.buffer) result[id] = object.buffer;
    // the mesh lives outside the DOM, so this means the two halves went out of sync
    else console.error(`STL projection rect ${id} has no mesh in the store, the object is not exported`);
  });

  return result;
};

/** Point-cloud block 7 sources, keyed by their SVG projection id. */
export const getPointCloudSources = (): Record<string, ArrayBuffer> => {
  const { objects } = useStlStore.getState();
  const result: Record<string, ArrayBuffer> = {};

  document.querySelectorAll(`#svgcontent [${POINT_CLOUD_ATTR.marker}]`).forEach(({ id }) => {
    const object = objects[id];

    if (object?.kind === 'point-cloud' && object.pointCloudBuffer) result[id] = object.pointCloudBuffer;
    else console.error(`Point-cloud projection ${id} has no point data in the store, the object is not exported`);
  });

  return result;
};
