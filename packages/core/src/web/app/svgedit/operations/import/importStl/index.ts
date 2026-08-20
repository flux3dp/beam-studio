import type { BufferGeometry } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
import { selectStlObject } from '@core/app/components/beambox/InnerEngraving/utils/selection';
import {
  getBaseSize,
  getMatrix,
  IDENTITY_TRANSFORM,
} from '@core/app/components/beambox/InnerEngraving/utils/transform';
import alertConstants from '@core/app/constants/alert-constants';
import type { StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import { syncStlObjectsWithDom } from '@core/app/svgedit/stl/sync';
import workareaManager from '@core/app/svgedit/workarea';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { todo } from '@core/helpers/is-dev';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

todo('建議使用 @core 路徑');
import history from '../../../history/history';
import undoManager from '../../../history/undoManager';

import { performStlPreChecks } from './preCheck';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

todo('TBD: resize + relocate 要視作 reset 參考的原始值嗎？這個行為要併入 import 還是另外有一個 history command？');

/** The user's answer to the adaptive-scaling prompt. Asked only when the model does not fit. */
const askToScaleDown = (): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    const t = i18n.lang.inner_engraving;

    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      caption: t.auto_fit_title,
      id: 'stl-auto-fit',
      message: t.auto_fit_message,
      messageIcon: 'notice',
      onNo: () => resolve(false),
      onYes: () => resolve(true),
    });
  });

/**
 * Initial placement for a freshly imported mesh: centred on the engravable area, at its real size.
 *
 * Centred rather than placed at the origin because inner engraving wants the work in the middle of
 * the field (PM, 08/06). The size is the model's own — Beam Studio's import convention is to keep
 * it — and shrinking is **offered rather than applied**: a model sticking out of the engravable
 * area silently loses whatever is outside, so the user is asked, but only when that is the case
 * (PM, 08/06: no prompt for a model that already fits). Declining is a valid answer; the object
 * panel's fit action is there to change one's mind later, and it also enlarges, which this never
 * does.
 *
 * When there is no engravable area at all — a workpiece smaller than twice the safety margin — the
 * fit has nothing to aim at, so the model keeps its size and is centred on the work area instead.
 * That is a legitimate configuration, not an error: the user still has to fix the material setup.
 */
export const getInitialTransform = async (geometry: BufferGeometry): Promise<StlTransform> => {
  const size = getBaseSize(geometry).multiplyScalar(MM_TO_SCENE);
  const box = getEngravableBox();

  if (!box.isValid) {
    return {
      ...IDENTITY_TRANSFORM,
      // rest the model on the focus origin rather than centring it on z = 0
      position: [workareaManager.width / 2, workareaManager.height / 2, size.z / 2],
    };
  }

  const centred: StlTransform = { ...IDENTITY_TRANSFORM, position: [...box.center] };
  // a zero extent (a flat model) does not constrain the fit, and must not turn it into NaN
  const fit = Math.min(
    1,
    size.x > 0 ? box.width / size.x : Infinity,
    size.y > 0 ? box.depth / size.y : Infinity,
    size.z > 0 ? box.height / size.z : Infinity,
  );

  if (fit >= 1) return centred;

  return (await askToScaleDown()) ? { ...centred, scale: [fit, fit, fit] } : centred;
};

/** Lets the browser paint the progress caption before the next blocking step runs. */
const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

const PROGRESS_ID = 'import-stl';

export const insertStlGeometry = async (buffer: ArrayBuffer, geometry: BufferGeometry): Promise<void> => {
  geometry.computeBoundingBox();

  if (!geometry.boundingBox) throw new Error('Failed to read STL geometry');

  const transform = await getInitialTransform(geometry);
  const id = svgCanvas.getNextId();
  const elem = svgCanvas.addSvgElementFromJson<SVGRectElement>({
    attr: {
      fill: 'none',
      height: 0,
      id,
      [STL_ATTR.marker]: '1',
      stroke: '#000',
      width: 0,
      x: 0,
      y: 0,
    },
    element: 'rect',
  });
  const object = { buffer, geometry, id, initialTransform: transform, transform };

  updateProjectionRect(elem, geometry, getMatrix(object), { initialTransform: transform, transform });
  useStlStore.getState().set(object);
  updateElementColor(elem);

  const batchCmd = new history.BatchCommand('Import STL');

  batchCmd.addSubCommand(new history.InsertElementCommand(elem));
  batchCmd.onAfter = () => syncStlObjectsWithDom([object]);
  undoManager.addCommandToHistory(batchCmd);
  selectStlObject(id);
};

/**
 * Import an STL file as an inner engraving object.
 *
 * Creates the two halves of an STL object: the mesh goes into the STL store as the 3D object, and a
 * projection rect goes into the current layer so selection, layers, undo/redo and .beam
 * serialization all work through the existing svgedit machinery.
 */
const importStl = async (file: File): Promise<void> => {
  if (!(await performStlPreChecks(file))) return;

  const t = i18n.lang.inner_engraving;
  let buffer: ArrayBuffer;
  let geometry: BufferGeometry;

  // A stepping bar rather than a spinner, even though neither step reports real progress: the two
  // slow parts (reading tens of megabytes off disk, and building the BufferGeometry) are worth
  // naming, so a 30-second import does not look like a hang. Real per-triangle progress would mean
  // moving the parse into a worker, which is the version to write if this proves not enough.
  await progressCaller.openSteppingProgress({ caption: t.reading_file, id: PROGRESS_ID, percentage: 0 });

  try {
    buffer = await file.arrayBuffer();

    progressCaller.update(PROGRESS_ID, { caption: t.parsing_mesh, percentage: 40 });
    await yieldToUi();

    geometry = new STLLoader().parse(buffer);
    geometry.computeBoundingBox();

    if (!geometry.boundingBox) {
      throw new Error(`Failed to read geometry from ${file.name}`);
    }

    progressCaller.update(PROGRESS_ID, { caption: t.placing_object, percentage: 90 });
    await yieldToUi();
  } finally {
    // closed before the placement prompt: a modal alert behind a progress dialog is unanswerable
    progressCaller.popById(PROGRESS_ID);
  }

  await insertStlGeometry(buffer, geometry);
};

export default importStl;
