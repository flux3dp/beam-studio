import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three';

import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';

import type { EngravableBox } from './engravable';
import { getWorldBox, setTransform } from './transform';

/**
 * One change applied to several objects as a whole, about a shared pivot (scene space).
 *
 * The parts compose as `p' = pivot + translation + rotation · scale · mirror · (p − pivot)` for every
 * point of every object, so the selection moves like one rigid (uniformly scaled) body.
 */
export interface GroupDelta {
  /** Mirror across the plane through the pivot that is perpendicular to this world axis. */
  mirrorAxis?: 0 | 1 | 2;
  rotation?: Quaternion;
  /** Uniform only: a per-axis factor on a rotated object would need a shear, which a decomposed
   *  `StlTransform` cannot hold. */
  scale?: number;
  translation?: Vector3;
}

/**
 * XYZ Euler angles of a pure rotation matrix.
 *
 * Not `Euler.setFromRotationMatrix`: three.js treats |sin y| > 0.9999999 as gimbal lock and zeroes
 * Z, which within about 0.03° of Y = ±90° turns the object by up to 0.03° on every group operation.
 * Here the general formula is used until cos y is truly zero.
 */
export const toEulerXYZ = (matrix: Matrix4): [number, number, number] => {
  // column-major
  const [m11, , , , m12, m22, m32, , m13, m23, m33] = matrix.elements;
  const y = Math.asin(Math.min(1, Math.max(-1, m13)));

  if (Math.hypot(m23, m33) < 1e-12) return [Math.atan2(m32, m22), y, 0];

  return [Math.atan2(-m23, m33), y, Math.atan2(-m12, m11)];
};

/** The union of the objects' world boxes, in scene space. */
export const getGroupBox = (objects: StlObject[]): Box3 =>
  objects.reduce((box, object) => box.union(getWorldBox(object)), new Box3());

/** The world-space matrix of a group delta, for checking the result against a plain matrix product. */
export const getGroupDeltaMatrix = (pivot: Vector3, delta: GroupDelta): Matrix4 => {
  const mirror = new Matrix4();

  if (delta.mirrorAxis !== undefined) {
    const signs = [1, 1, 1];

    signs[delta.mirrorAxis] = -1;
    mirror.makeScale(signs[0], signs[1], signs[2]);
  }

  const translation = delta.translation ?? new Vector3();

  return new Matrix4()
    .makeTranslation(pivot.x + translation.x, pivot.y + translation.y, pivot.z + translation.z)
    .multiply(new Matrix4().makeRotationFromQuaternion(delta.rotation ?? new Quaternion()))
    .multiply(new Matrix4().makeScale(delta.scale ?? 1, delta.scale ?? 1, delta.scale ?? 1))
    .multiply(mirror)
    .multiply(new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
};

/**
 * Where one object's transform ends up when the group it belongs to is transformed by `delta`.
 *
 * An object's matrix is `T(position) · R · S · F · T(−centre)` (`getMatrix`), and the delta is a
 * rotation Q, a uniform factor s and a mirror M about the pivot. Then:
 * - the centre moves like any other point: `position' = pivot + t + Q·s·M·(position − pivot)`
 * - the linear part is `Q·s·M·R·S·F = (Q·M·R·M)·(s·S)·(M·F)`, because M·M = I and diagonal matrices
 *   commute. `Q·M·R·M` is a proper rotation (M·R·M has determinant 1), so it can be stored as Euler
 *   angles, the factor goes into the positive `scale`, and the mirror toggles the object's own flip
 *   on the same axis.
 */
export const transformInGroup = (transform: StlTransform, pivot: Vector3, delta: GroupDelta): StlTransform => {
  const { mirrorAxis, rotation: q = new Quaternion(), scale: s = 1, translation: t = new Vector3() } = delta;
  const signs = new Vector3(1, 1, 1);

  if (mirrorAxis !== undefined) signs.setComponent(mirrorAxis, -1);

  const offset = new Vector3(...transform.position).sub(pivot).multiply(signs).multiplyScalar(s).applyQuaternion(q);
  const position = pivot.clone().add(t).add(offset);

  let rotation = transform.rotation;

  if (delta.rotation) {
    const mirror = new Matrix4().makeScale(signs.x, signs.y, signs.z);
    const rotationMatrix = new Matrix4()
      .makeRotationFromQuaternion(q)
      .multiply(mirror)
      .multiply(new Matrix4().makeRotationFromEuler(new Euler(...transform.rotation, 'XYZ')))
      .multiply(mirror);

    rotation = toEulerXYZ(rotationMatrix);
  } else if (mirrorAxis !== undefined) {
    // M·Rx(a)·Ry(b)·Rz(c)·M = Rx(±a)·Ry(±b)·Rz(±c): a rotation about the mirrored axis is kept, the
    // other two reverse. Exact, so the angles in the panel do not drift through a matrix round trip
    rotation = transform.rotation.map((angle, axis) => (axis === mirrorAxis ? angle : -angle || 0)) as [
      number,
      number,
      number,
    ];
  }

  const flip = [...transform.flip] as StlTransform['flip'];

  if (mirrorAxis !== undefined) flip[mirrorAxis] = !flip[mirrorAxis];

  return {
    flip,
    position: position.toArray(),
    rotation: [...rotation],
    scale: [transform.scale[0] * s, transform.scale[1] * s, transform.scale[2] * s],
  };
};

/**
 * Transform several objects as one, about the centre of their union box unless a pivot is given.
 * One undo step for the whole group.
 */
export const applyGroupTransform = (objects: StlObject[], delta: GroupDelta, pivot?: Vector3): void => {
  if (objects.length === 0) return;

  const center = pivot ?? getGroupBox(objects).getCenter(new Vector3());
  const batchCmd = new history.BatchCommand('Transform 3D objects');

  objects.forEach((object) => {
    setTransform(object, transformInGroup(object.transform, center, delta), { parentCmd: batchCmd });
  });

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};

/** Move the selection so the centre of its union box lands on `target`, in scene space. */
export const moveObjectsCenterTo = (objects: StlObject[], target: [number, number, number]): void => {
  const center = getGroupBox(objects).getCenter(new Vector3());

  applyGroupTransform(objects, { translation: new Vector3(...target).sub(center) }, center);
};

/**
 * Scale the selection as a whole until it fills `box`, then centre it there.
 *
 * Unlike the fit on import this **also enlarges**: import keeps the model's real size unless it has
 * to shrink it, whereas asking for this is asking for the largest engraving the workpiece allows.
 *
 * The fit is measured on the union of the world boxes, so rotated objects still end up inside.
 */
export const fitObjectsTo = (objects: StlObject[], box: EngravableBox): void => {
  const groupBox = getGroupBox(objects);
  const size = groupBox.getSize(new Vector3());
  // a flat selection has a zero extent on some axis, which does not constrain the fit and must not
  // turn the factor into Infinity or NaN
  const factor = Math.min(
    size.x > 0 ? box.width / size.x : Infinity,
    size.y > 0 ? box.depth / size.y : Infinity,
    size.z > 0 ? box.height / size.z : Infinity,
  );

  if (!Number.isFinite(factor) || factor <= 0) return;

  const center = groupBox.getCenter(new Vector3());

  applyGroupTransform(objects, { scale: factor, translation: new Vector3(...box.center).sub(center) }, center);
};

/** What a drag of the multi-selection gizmo started from. */
export interface GroupDragStart {
  pivot: Vector3;
  transforms: Record<string, StlTransform>;
}

/** Below this the objects are invisible and their transforms are not invertible. */
const MIN_GROUP_SCALE = 1e-3;

/**
 * The gizmo scales one axis at a time; the axis that moved the most sets the factor for all, since a
 * per-axis factor on a rotated object would need a shear.
 */
export const getUniformFactor = (scale: Vector3): number =>
  Math.max(
    scale.toArray().reduce((far, ratio) => (Math.abs(Math.log(ratio)) > Math.abs(Math.log(far)) ? ratio : far), 1),
    MIN_GROUP_SCALE,
  );

/**
 * Each object's transform for the gizmo's current state. The gizmo moves a proxy that started at
 * `start.pivot` with no rotation and unit scale, so its offset, rotation and (uniform) scale are the
 * delta itself.
 */
export const getGroupDragTransforms = (
  start: GroupDragStart,
  proxy: { position: Vector3; quaternion: Quaternion; scale: number },
): Record<string, StlTransform> => {
  const delta: GroupDelta = {
    rotation: proxy.quaternion.clone(),
    scale: proxy.scale,
    translation: proxy.position.clone().sub(start.pivot),
  };

  return Object.fromEntries(
    Object.entries(start.transforms).map(([id, transform]) => [id, transformInGroup(transform, start.pivot, delta)]),
  );
};

/** Record a finished drag as one undo step, from the transforms the drag started at. */
export const commitGroupDrag = (start: GroupDragStart, next: Record<string, StlTransform>): void => {
  const batchCmd = new history.BatchCommand('Transform 3D objects');
  const { objects } = useStlStore.getState();

  Object.entries(next).forEach(([id, transform]) => {
    const object = objects[id];

    if (object) setTransform({ ...object, transform: start.transforms[id] }, transform, { parentCmd: batchCmd });
  });

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
