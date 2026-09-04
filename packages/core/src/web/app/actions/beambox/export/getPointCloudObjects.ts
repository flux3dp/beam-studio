import { useStlStore } from '@core/app/stores/stlStore';
import { PHOTO_3D_ATTR, POINT_CLOUD_ATTR } from '@core/app/svgedit/stl/constants';

import { toBase64 } from './getStlObjects';

/**
 * Build the BSPC payload for generated point-cloud objects in the live document.
 * Plain photos remain SVG image projections and are sampled by Swiftray.
 */
const getPointCloudObjects = async (): Promise<Record<string, string> | undefined> => {
  const { objects } = useStlStore.getState();
  const photos = Array.from(
    document.querySelectorAll<SVGImageElement>(
      `#svgcontent image[${PHOTO_3D_ATTR.marker}][${POINT_CLOUD_ATTR.marker}]`,
    ),
  );

  if (photos.length === 0) return undefined;

  const entries = await Promise.all(
    photos.map(async (elem) => {
      const object = objects[elem.id];

      if (!object) throw new Error(`3D photo ${elem.id} has no runtime object`);

      if (object.kind !== 'point-cloud' || !object.pointCloudBuffer) {
        throw new Error(`Point-cloud object ${elem.id} has no BSPC data`);
      }

      return [elem.id, await toBase64(object.pointCloudBuffer)] as const;
    }),
  );

  return Object.fromEntries(entries);
};

export default getPointCloudObjects;
