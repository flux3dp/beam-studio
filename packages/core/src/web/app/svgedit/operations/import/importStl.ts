import type { BufferGeometry } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
import { selectStlObject } from '@core/app/components/beambox/InnerEngraving/utils/selection';
import {
  getBaseSize,
  getMatrix,
  IDENTITY_TRANSFORM,
} from '@core/app/components/beambox/InnerEngraving/utils/transform';
import type { StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import workareaManager from '@core/app/svgedit/workarea';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { todo } from '@core/helpers/is-dev';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

todo('建議使用 @core 路徑');
import history from '../../history/history';
import undoManager from '../../history/undoManager';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

todo(
  'TBD with PM: 匯入慣例是原大小 + 放置在畫布原點，依舊要維持 resize + relocate 的功能嗎？詢問視窗可以加不再顯示，或者加到偏好設定裡',
);
todo('TBD: resize + relocate 要視作 reset 參考的原始值嗎？這個行為要併入 import 還是另外有一個 history command？');

todo('自動縮小要改成彈窗詢問（TODO.md 第 4 點的【自適應縮放】），目前是直接縮');

/**
 * Initial placement for a freshly imported mesh: centred on the engravable area, shrunk to fit it.
 *
 * Centred rather than placed at the origin because inner engraving wants the work in the middle of
 * the field (PM, 08/06), and shrunk because a model that pokes out of the engravable area would
 * silently lose whatever sticks out. It **only ever shrinks** — importing at the model's real size
 * is the convention, fitting is the exception. (The panel's fit action does enlarge; that one is
 * asked for explicitly.)
 *
 * When there is no engravable area at all — a workpiece smaller than twice the safety margin — the
 * fit has nothing to aim at, so the model keeps its size and is centred on the work area instead.
 * That is a legitimate configuration, not an error: the user still has to fix the material setup.
 */
const getInitialTransform = (geometry: BufferGeometry): StlTransform => {
  const size = getBaseSize(geometry).multiplyScalar(MM_TO_SCENE);
  const box = getEngravableBox();

  if (!box.isValid) {
    return {
      ...IDENTITY_TRANSFORM,
      // rest the model on the focus origin rather than centring it on z = 0
      position: [workareaManager.width / 2, workareaManager.height / 2, size.z / 2],
    };
  }

  const fit = Math.min(
    1,
    size.x > 0 ? box.width / size.x : Infinity,
    size.y > 0 ? box.depth / size.y : Infinity,
    size.z > 0 ? box.height / size.z : Infinity,
  );

  return { ...IDENTITY_TRANSFORM, position: [...box.center], scale: [fit, fit, fit] };
};

todo('TBC: importStl 期間需要額外加一個 modal 嗎？寫在 TODO 裡，應該是後期階段再補');

/**
 * Import an STL file as an inner engraving object.
 *
 * Creates the two halves of an STL object: the mesh goes into the STL store as the 3D object, and a
 * projection rect goes into the current layer so selection, layers, undo/redo and .beam
 * serialization all work through the existing svgedit machinery.
 */
const importStl = async (file: File): Promise<void> => {
  const buffer = await file.arrayBuffer();
  const geometry = new STLLoader().parse(buffer);

  geometry.computeBoundingBox();

  if (!geometry.boundingBox) {
    throw new Error(`Failed to read geometry from ${file.name}`);
  }

  const transform = getInitialTransform(geometry);
  const id = svgCanvas.getNextId();
  const elem = svgCanvas.addSvgElementFromJson<SVGRectElement>({
    attr: {
      'data-stl-name': file.name,
      fill: 'none',
      // geometry is filled in by updateProjectionRect below
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
  // the mesh lives outside the DOM, so undo/redo has to add and remove it alongside the rect
  batchCmd.onAfter = () => {
    if (elem.parentNode) useStlStore.getState().set(object);
    else useStlStore.getState().remove(id);
  };
  undoManager.addCommandToHistory(batchCmd);

  // one call for both halves of the selection: the mesh in the store and the rect in svgedit
  selectStlObject(id);
};

export default importStl;
