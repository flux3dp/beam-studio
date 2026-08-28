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

import { PHOTO_3D_ATTR, POINT_CLOUD_ATTR } from './constants';
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

/**
 * Temporarily remove photo sources from the flat bitmap export path.
 *
 * A fallback plane is display-only; a converted photo's point cloud travels in its own payload and
 * must eventually be handled by the relief backend, never engraved again as a 2D bitmap.
 */
export const detachPhotoPlaneElements = (): (() => void) => {
  const detached = Array.from(
    document.querySelectorAll<SVGImageElement>(`#svgcontent image[${PHOTO_3D_ATTR.marker}]`),
  ).map((elem) => ({ elem, next: elem.nextSibling, parent: elem.parentNode! }));

  detached.forEach(({ elem }) => elem.remove());

  return () => detached.reverse().forEach(({ elem, next, parent }) => parent.insertBefore(elem, next));
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
