import progressCaller from '@core/app/actions/progress-caller';
import { selectStlObject } from '@core/app/components/beambox/InnerEngraving/utils/selection';
import { useStlStore } from '@core/app/stores/stlStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { initializePhotoPlane } from '@core/app/svgedit/stl/photoPlane';
import { applyPhotoPointCloud } from '@core/app/svgedit/stl/photoPointCloud';
import { syncStlObjectsWithDom } from '@core/app/svgedit/stl/sync';
import {
  fetchReplicateSampleResult,
  type ReplicatePointCloudSample,
  type ReplicateSampleDisplay,
} from '@core/helpers/image/replicatePointCloud';
import { isUvDev2 } from '@core/helpers/is-dev';

import { insertStlGeometry } from './importStl';
import readBitmapFile from './readBitmapFile';

void isUvDev2();

const PROGRESS_ID = 'import-replicate-point-cloud';
const TARGET_WIDTH_SCENE = 1000;

/** Load and import one captured result as a point cloud, reference mesh, or lit relief mesh. */
const importReplicatePointCloudSample = async (
  sample: ReplicatePointCloudSample,
  display: ReplicateSampleDisplay,
): Promise<void> => {
  await progressCaller.openSteppingProgress({
    caption: 'Loading captured 3D sample',
    id: PROGRESS_ID,
    percentage: 0,
  });

  let elem: SVGImageElement | undefined;
  let progressOpen = true;

  try {
    const result = await fetchReplicateSampleResult(sample, display);

    if (result.kind === 'mesh') {
      progressCaller.update(PROGRESS_ID, { caption: 'Placing mesh', percentage: 90 });
      progressCaller.popById(PROGRESS_ID);
      progressOpen = false;
      await insertStlGeometry(result.buffer, result.geometry);

      return;
    }

    progressCaller.update(PROGRESS_ID, { caption: 'Placing point cloud', percentage: 85 });

    const command = new history.BatchCommand('Import Replicate Point Cloud');

    elem = await readBitmapFile(result.source, { parentCmd: command });

    const sourceWidth = Number(elem.getAttribute('width'));
    const sourceHeight = Number(elem.getAttribute('height'));

    if (sourceWidth > 0 && sourceHeight > 0) {
      elem.setAttribute('width', String(TARGET_WIDTH_SCENE));
      elem.setAttribute('height', String((TARGET_WIDTH_SCENE * sourceHeight) / sourceWidth));
    }

    const photoObject = initializePhotoPlane(elem);
    const pointCloudObject = applyPhotoPointCloud(elem.id, result.pointCloudBuffer, {
      addToHistory: false,
      parentCmd: command,
    });

    command.onAfter = () => syncStlObjectsWithDom([photoObject, pointCloudObject]);
    undoManager.addCommandToHistory(command);
    selectStlObject(elem.id);
  } catch (error) {
    // Network and conversion finish before insertion in the common case. If image decoding failed
    // after creating its SVG element, do not leave an object outside undo history behind.
    if (elem) {
      elem.remove();
      useStlStore.getState().remove(elem.id);
    }

    throw error;
  } finally {
    if (progressOpen) progressCaller.popById(PROGRESS_ID);
  }
};

export default importReplicatePointCloudSample;
