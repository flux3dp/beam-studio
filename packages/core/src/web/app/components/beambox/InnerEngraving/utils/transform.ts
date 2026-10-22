import type { Box3, BufferGeometry } from 'three';
import { Euler, Matrix4, Vector3 } from 'three';

import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { BaseHistoryCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import type { ICommand } from '@core/interfaces/IHistory';

import { MM_TO_SCENE } from './coordinates';
import { updateProjectionRect } from './projection';

/** A freshly imported mesh: original size, no rotation, no mirror. */
export const IDENTITY_TRANSFORM: Omit<StlTransform, 'position'> = {
  flip: [false, false, false],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

/** The mesh's own bounding box centre, in mm. Every transform is expressed about this point. */
export const getMeshCenter = (geometry: BufferGeometry): Vector3 => {
  if (!geometry.boundingBox) geometry.computeBoundingBox();

  return geometry.boundingBox!.getCenter(new Vector3());
};

/** The mesh's unscaled size, in mm. */
export const getBaseSize = (geometry: BufferGeometry): Vector3 => {
  if (!geometry.boundingBox) geometry.computeBoundingBox();

  return geometry.boundingBox!.getSize(new Vector3());
};

/** The object's size along its own axes, in mm — base size times scale, ignoring rotation. */
export const getSize = ({ geometry, transform }: StlObject): Vector3 =>
  getBaseSize(geometry).multiply(new Vector3(...transform.scale));

/**
 * The matrix the rest of the world sees: mesh space (mm) -> scene space (0.1mm).
 *
 * Composed as `T(position) · R · S · T(-centre)`, so position is the object's centre and rotation
 * and scale act about it. The mm -> 0.1mm factor and the mirror signs live in S, which is why the
 * matrix must never be decomposed back into the stored transform.
 */
export const getMatrix = ({ geometry, transform }: StlObject): Matrix4 => {
  const { flip, position, rotation, scale } = transform;
  const center = getMeshCenter(geometry);
  const signs = flip.map((flipped) => (flipped ? -1 : 1));

  return new Matrix4()
    .makeTranslation(position[0], position[1], position[2])
    .multiply(new Matrix4().makeRotationFromEuler(new Euler(rotation[0], rotation[1], rotation[2], 'XYZ')))
    .multiply(
      new Matrix4().makeScale(
        scale[0] * signs[0] * MM_TO_SCENE,
        scale[1] * signs[1] * MM_TO_SCENE,
        scale[2] * signs[2] * MM_TO_SCENE,
      ),
    )
    .multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
};

/** The object's axis-aligned bounding box in scene space. */
export const getWorldBox = (object: StlObject): Box3 => {
  if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();

  return object.geometry.boundingBox!.clone().applyMatrix4(getMatrix(object));
};

/** Write the transform onto the object's projection rect, which is derived from it. */
const reproject = (object: StlObject, transform: StlTransform): void => {
  const elem = document.getElementById(object.id) as null | SVGRectElement;

  if (elem) {
    updateProjectionRect(elem, object.geometry, getMatrix({ ...object, transform }), {
      initialTransform: object.initialTransform,
      transform,
    });
  }
};

/**
 * Undo entry for a 3D transform.
 *
 * The mesh is not in the DOM, so none of svgedit's element-based commands can carry it; this
 * mirrors the shape of `SingleDocumentStoreCommand`. `elements()` returns the projection rect so
 * that undo still reports something selectable to the rest of the editor.
 */
export class StlTransformCommand extends BaseHistoryCommand implements ICommand {
  elements = (): Element[] => {
    const elem = document.getElementById(this.id);

    return elem ? [elem] : [];
  };

  type = (): string => 'StlTransformCommand';

  constructor(
    private id: string,
    private oldTransform: StlTransform,
    private newTransform: StlTransform,
  ) {
    super();
  }

  private restore = (transform: StlTransform) => {
    const object = useStlStore.getState().objects[this.id];

    // the object is gone when the whole import was undone first; that command owns the mesh
    if (!object) return;

    useStlStore.getState().setTransform(this.id, transform);
    reproject(object, transform);
  };

  doApply = (): void => this.restore(this.newTransform);

  doUnapply = (): void => this.restore(this.oldTransform);
}

interface SetTransformOptions {
  /** Off while a gizmo drag is in flight: only the finished drag is worth one undo step. */
  addToHistory?: boolean;
  parentCmd?: { addSubCommand: (cmd: ICommand) => void };
}

/**
 * Change an STL object's 3D transform: store, projection rect and undo history together.
 *
 * Everything that moves an object outside the gizmo goes through here. The store is the source of
 * truth, but nothing subscribes to it on behalf of the projection rect, so a store write on its own
 * would leave the rect stale — and with it selection, alignment, framing and the .beam file.
 */
export const setTransform = (
  object: StlObject,
  transform: StlTransform,
  { addToHistory = true, parentCmd }: SetTransformOptions = {},
): void => {
  const oldTransform = object.transform;

  useStlStore.getState().setTransform(object.id, transform);
  reproject(object, transform);

  if (!addToHistory && !parentCmd) return;

  const cmd = new StlTransformCommand(object.id, oldTransform, transform);

  if (parentCmd) parentCmd.addSubCommand(cmd);
  else undoManager.addCommandToHistory(cmd);
};
