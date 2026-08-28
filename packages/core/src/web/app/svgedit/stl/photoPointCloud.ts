import { updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
import { getMatrix } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { BaseHistoryCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import type { ICommand } from '@core/interfaces/IHistory';

import { PHOTO_3D_ATTR, POINT_CLOUD_ATTR } from './constants';
import { createPointCloudGeometry, decodePointCloud } from './pointCloud';

const restoreObject = (object: StlObject): void => {
  const elem = document.getElementById(object.id) as unknown as null | SVGImageElement;

  if (!elem) return;

  if (object.kind === 'point-cloud' && object.pointCloudBuffer) {
    elem.setAttribute(POINT_CLOUD_ATTR.marker, String(decodePointCloud(object.pointCloudBuffer).version));
  } else {
    elem.removeAttribute(POINT_CLOUD_ATTR.marker);
  }

  useStlStore.getState().set(object);
  updateProjectionRect(elem, object.geometry, getMatrix(object), {
    initialTransform: object.initialTransform,
    transform: object.transform,
  });
};

export class PhotoPointCloudCommand extends BaseHistoryCommand implements ICommand {
  type = (): string => 'PhotoPointCloudCommand';

  constructor(
    private oldObject: StlObject,
    private newObject: StlObject,
  ) {
    super();
    this.text = 'Apply Photo Relief';
  }

  elements = (): Element[] => {
    const elem = document.getElementById(this.newObject.id);

    return elem ? [elem] : [];
  };

  doApply = (): void => restoreObject(this.newObject);

  doUnapply = (): void => restoreObject(this.oldObject);
}

interface ApplyPhotoPointCloudOptions {
  addToHistory?: boolean;
  parentCmd?: { addSubCommand: (command: ICommand) => void };
}

/**
 * Replace a photo plane's 3D representation with an API-produced point cloud.
 *
 * The SVG image stays in place as the preserved source, although its controls are hidden once the
 * point cloud exists. Only the runtime geometry and a marker pointing to .beam block 7 change, so
 * the future relief API can rebuild the result without losing the original bitmap.
 */
export const applyPhotoPointCloud = (
  id: string,
  pointCloudBuffer: ArrayBuffer,
  { addToHistory = true, parentCmd }: ApplyPhotoPointCloudOptions = {},
): StlObject => {
  const elem = document.getElementById(id);
  const oldObject = useStlStore.getState().objects[id];

  if (!elem?.getAttribute(PHOTO_3D_ATTR.marker) || !oldObject) {
    throw new Error(`Photo plane ${id} does not exist`);
  }

  if (oldObject.kind !== 'photo' && oldObject.kind !== 'point-cloud') {
    throw new Error(`3D object ${id} is not a photo`);
  }

  const geometry = createPointCloudGeometry(pointCloudBuffer);
  const newObject: StlObject = {
    ...oldObject,
    geometry,
    kind: 'point-cloud',
    pointCloudBuffer,
  };
  const command = new PhotoPointCloudCommand(oldObject, newObject);

  restoreObject(newObject);

  if (parentCmd) parentCmd.addSubCommand(command);
  else if (addToHistory) undoManager.addCommandToHistory(command);

  return newObject;
};
