import { PlaneGeometry } from 'three';

import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { getMaterial } from '@core/app/components/beambox/InnerEngraving/utils/material';
import { updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
import { getMatrix, IDENTITY_TRANSFORM } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { getHref } from '@core/app/svgedit/utils/href';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { PHOTO_3D_ATTR, POINT_CLOUD_ATTR, STL_ATTR } from './constants';
import { parseStlTransform } from './transformAttr';

export const photoPlaneEvents = eventEmitterFactory.createEventEmitter();

const createGeometry = (widthMm: number, heightMm: number): PlaneGeometry => {
  const geometry = new PlaneGeometry(widthMm, heightMm);

  geometry.computeBoundingBox();

  return geometry;
};

export const getPhotoTextureUrl = (elem: SVGImageElement): null | string =>
  elem.getAttribute('xlink:href') || getHref(elem) || elem.getAttribute('href') || elem.getAttribute('origImage');

export const createPhotoPlaneObject = (elem: SVGImageElement): null | StlObject => {
  const width = Number(elem.getAttribute(PHOTO_3D_ATTR.width));
  const height = Number(elem.getAttribute(PHOTO_3D_ATTR.height));
  const transforms = parseStlTransform(elem);
  const textureUrl = getPhotoTextureUrl(elem);

  if (!(width > 0) || !(height > 0) || !transforms || !textureUrl) return null;

  return {
    geometry: createGeometry(width, height),
    id: elem.id,
    kind: 'photo',
    textureUrl,
    ...transforms,
  };
};

/** Rebuild photo planes after SVG block 1 and image-source block 2 have both been read. */
export const readPhotoPlaneObjects = (): StlObject[] =>
  Array.from(document.querySelectorAll<SVGImageElement>(`#svgcontent image[${PHOTO_3D_ATTR.marker}]`))
    .filter((elem) => !elem.hasAttribute(POINT_CLOUD_ATTR.marker))
    .map(createPhotoPlaneObject)
    .filter((object): object is StlObject => Boolean(object));

/** Legacy helper for exports that cannot send typed photo projections to the backend. */
export const detachPhotoPlaneElements = (): (() => void) => {
  const detached = Array.from(
    document.querySelectorAll<SVGImageElement>(`#svgcontent image[${PHOTO_3D_ATTR.marker}]`),
  ).map((elem) => ({ elem, next: elem.nextSibling, parent: elem.parentNode! }));

  detached.forEach(({ elem }) => elem.remove());

  return () => detached.reverse().forEach(({ elem, next, parent }) => parent.insertBefore(elem, next));
};

/**
 * Prepare photo-backed 3D objects for one Swiftray export.
 *
 * Plain photos keep their image data and all projection metadata, receiving only a temporary
 * `photo` kind so Swiftray can dither and place them in 3D. Generated point clouds replace that
 * same editable source image with a lightweight placeholder and resolve their BSPC binary from
 * `pointCloudObjects`.
 */
export const preparePhotoPlaneElementsForExport = (): (() => void) => {
  const photos = Array.from(document.querySelectorAll<SVGImageElement>(`#svgcontent image[${PHOTO_3D_ATTR.marker}]`));
  const temporaryAttributes = [STL_ATTR.kind, STL_ATTR.marker, STL_ATTR.mode];
  const annotated = photos
    .filter((elem) => !elem.hasAttribute(POINT_CLOUD_ATTR.marker))
    .map((elem) => {
      const previous = temporaryAttributes.map((name) => [name, elem.getAttribute(name)] as const);

      elem.setAttribute(STL_ATTR.kind, 'photo');
      elem.setAttribute(STL_ATTR.marker, '1');
      elem.setAttribute(STL_ATTR.mode, 'dot');

      return { elem, previous };
    });
  const replacements = photos
    .filter((elem) => elem.hasAttribute(POINT_CLOUD_ATTR.marker))
    .map((elem) => {
      const next = elem.nextSibling;
      const parent = elem.parentNode!;
      const placeholder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

      for (const attribute of Array.from(elem.attributes)) {
        if (!['href', 'origImage', 'xlink:href'].includes(attribute.name)) {
          placeholder.setAttribute(attribute.name, attribute.value);
        }
      }

      placeholder.setAttribute('fill', 'none');
      placeholder.setAttribute('stroke', '#000');
      placeholder.setAttribute(STL_ATTR.kind, 'point-cloud');
      placeholder.setAttribute(STL_ATTR.marker, '1');
      placeholder.setAttribute(STL_ATTR.mode, 'dot');
      elem.replaceWith(placeholder);

      return { elem, next, parent, placeholder };
    });

  return () => {
    replacements.reverse().forEach(({ elem, next, parent, placeholder }) => {
      placeholder.remove();
      parent.insertBefore(elem, next?.parentNode === parent ? next : null);
    });
    annotated.forEach(({ elem, previous }) =>
      previous.forEach(([name, value]) => {
        if (value === null) elem.removeAttribute(name);
        else elem.setAttribute(name, value);
      }),
    );
  };
};

/** Turn an imported SVG image into a zero-thickness plane centred halfway up the material. */
export const initializePhotoPlane = (elem: SVGImageElement): StlObject => {
  const widthScene = Number(elem.getAttribute('width'));
  const heightScene = Number(elem.getAttribute('height'));
  const widthMm = widthScene / MM_TO_SCENE;
  const heightMm = heightScene / MM_TO_SCENE;
  const geometry = createGeometry(widthMm, heightMm);
  const box = getEngravableBox();
  const center = box.isValid
    ? box.center
    : ([workareaManager.width / 2, workareaManager.height / 2, 0] as [number, number, number]);
  const fit = box.isValid ? Math.min(1, box.width / widthScene, box.depth / heightScene) : 1;
  const transform: StlTransform = {
    ...IDENTITY_TRANSFORM,
    position: [center[0], center[1], getMaterial().height / 2],
    scale: [fit, fit, 1],
  };
  const object: StlObject = {
    geometry,
    id: elem.id,
    initialTransform: transform,
    kind: 'photo',
    textureUrl: getPhotoTextureUrl(elem)!,
    transform,
  };

  elem.setAttribute(PHOTO_3D_ATTR.marker, '1');
  elem.setAttribute(PHOTO_3D_ATTR.width, String(widthMm));
  elem.setAttribute(PHOTO_3D_ATTR.height, String(heightMm));
  updateProjectionRect(elem, geometry, getMatrix(object), { initialTransform: transform, transform });
  useStlStore.getState().set(object);

  return object;
};
