import { useStlStore } from '@core/app/stores/stlStore';
import { POINT_CLOUD_ATTR } from '@core/app/svgedit/stl/constants';

import { toBase64 } from './getStlObjects';

/**
 * Build the BSPC payload for generated and directly imported point-cloud objects.
 * Plain photos remain SVG image projections and are sampled by Swiftray.
 */
const getPointCloudObjects = async (): Promise<Record<string, string> | undefined> => {
  const { objects } = useStlStore.getState();
  const projections = Array.from(document.querySelectorAll(`#svgcontent [${POINT_CLOUD_ATTR.marker}]`));

  if (projections.length === 0) return undefined;

  const entries = await Promise.all(
    projections.map(async (elem) => {
      const object = objects[elem.id];

      if (!object) throw new Error(`Point-cloud projection ${elem.id} has no runtime object`);

      if (object.kind !== 'point-cloud' || !object.pointCloudBuffer) {
        throw new Error(`Point-cloud object ${elem.id} has no BSPC data`);
      }

      return [elem.id, await toBase64(object.pointCloudBuffer)] as const;
    }),
  );

  return Object.fromEntries(entries);
};

export default getPointCloudObjects;
