import type { Vector3 } from 'three';

import { MM_TO_SCENE } from './coordinates';

export const ROTATION_SNAP_RAD = Math.PI / 12;
export const TRANSLATION_SNAP = MM_TO_SCENE;

const CENTER_SNAP_DISTANCE = MM_TO_SCENE / 2;
const SIZE_SNAP_MM = 1;

const snapLength = (value: number): number => Math.max(SIZE_SNAP_MM, Math.round(value / SIZE_SNAP_MM) * SIZE_SNAP_MM);

/** Snap a translated object to the 1mm scene grid and to the engravable area's centre. */
export const snapPosition = (position: Vector3, center: [number, number, number]): void => {
  const snapped = position
    .toArray()
    .map((value, axis) =>
      Math.abs(value - center[axis]) <= CENTER_SNAP_DISTANCE
        ? center[axis]
        : Math.round(value / TRANSLATION_SNAP) * TRANSLATION_SNAP,
    ) as [number, number, number];

  position.set(snapped[0], snapped[1], snapped[2]);
};

/** Snap the object's own-axis dimensions to whole millimetres. */
export const snapScale = (scale: Vector3, baseSize: Vector3, ratioLocked: boolean): void => {
  if (ratioLocked) {
    const sizes = [baseSize.x * scale.x, baseSize.y * scale.y, baseSize.z * scale.z];
    const axis = sizes.reduce((largest, size, index) => (size > sizes[largest] ? index : largest), 0);
    const size = sizes[axis];

    if (size > 0) scale.multiplyScalar(snapLength(size) / size);

    return;
  }

  const snapped = scale.toArray().map((value, axis) => {
    const base = baseSize.getComponent(axis);

    return base > 0 ? snapLength(base * value) / base : value;
  }) as [number, number, number];

  scale.set(snapped[0], snapped[1], snapped[2]);
};
