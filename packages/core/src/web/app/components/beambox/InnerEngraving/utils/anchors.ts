import type { Group } from 'three';
import { Euler } from 'three';

import type { StlTransform } from '@core/app/stores/stlStore';

import { MM_TO_SCENE } from './coordinates';

/**
 * The anchor group of every mounted `StlMesh`, by object id, so the group gizmo can move the
 * selected meshes directly while a drag goes on. Writing the store each frame instead would
 * re-render every mesh and the dimension panel on every pointer move, which is what makes a
 * multi-selection drag stutter; like a single object's gizmo, the store is written once on release.
 */
const anchors = new Map<string, Group>();

export const registerAnchor = (id: string, anchor: Group | null): void => {
  if (anchor) anchors.set(id, anchor);
  else anchors.delete(id);
};

export const getAnchor = (id: string): Group | undefined => anchors.get(id);

/** Put `transform` onto an anchor the way `StlMesh` renders it: positive scale in scene units, the mirror stays on the child. */
export const applyTransformToAnchor = (anchor: Group, { position, rotation, scale }: StlTransform): void => {
  anchor.position.set(position[0], position[1], position[2]);
  anchor.quaternion.setFromEuler(new Euler(rotation[0], rotation[1], rotation[2], 'XYZ'));
  anchor.scale.set(scale[0] * MM_TO_SCENE, scale[1] * MM_TO_SCENE, scale[2] * MM_TO_SCENE);
  anchor.updateMatrixWorld(true);
};
