import { Matrix4, Vector3 } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

import { MM_TO_SCENE, svgToSceneY } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
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
import selectionManager from '../../selection';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

todo(
  'TBD with PM: 匯入慣例是原大小 + 放置在畫布原點，依舊要維持 resize + relocate 的功能嗎？詢問視窗可以加不再顯示，或者加到偏好設定裡',
);
todo('TBD: resize + relocate 要視作 reset 參考的原始值嗎？這個行為要併入 import 還是另外有一個 history command？');

// esther ask: boundingBox 是 mm？translate（SCENE unit） 和 scale （MM_TO_SCENE） 相乘不會導致兩倍嗎？
/**
 * Initial placement for a freshly imported mesh: centred on the work area in XY, sitting on z = 0.
 *
 * The returned matrix maps mesh space (mm) to scene space (0.1mm).
 */
const getInitialMatrix = (boundingBox: { max: Vector3; min: Vector3 }): Matrix4 => {
  const center = new Vector3().addVectors(boundingBox.min, boundingBox.max).multiplyScalar(0.5);
  const scale = new Matrix4().makeScale(MM_TO_SCENE, MM_TO_SCENE, MM_TO_SCENE);
  const translate = new Matrix4().makeTranslation(
    workareaManager.width / 2 - center.x * MM_TO_SCENE,
    svgToSceneY(workareaManager.height / 2) - center.y * MM_TO_SCENE,
    // rest the model on the focus origin rather than centring it on z = 0
    -boundingBox.min.z * MM_TO_SCENE,
  );

  return translate.multiply(scale);
};

todo('TBC: importStl 期間需要額外加一個 modal 嗎？寫在 TODO 裡，應該是後期階段再補');
todo(
  'FIXME: selectionManager.selectOnly([elem]); 要和 three js 的 select 同步，見 stlStore 註解的 TODO。注意 undo redo 後不需要重新選中',
);

/**
 * Import an STL file as an inner engraving object.
 *
 * Creates the two halves of an STL object: the mesh goes into the STL store as the 3D object, and a
 * projection rect goes into the current layer so selection, layers, undo/redo and .beam
 * serialization all work through the existing svgedit machinery.
 */
const importStl = async (file: File): Promise<void> => {
  const geometry = new STLLoader().parse(await file.arrayBuffer());

  geometry.computeBoundingBox();

  if (!geometry.boundingBox) {
    throw new Error(`Failed to read geometry from ${file.name}`);
  }

  const matrix = getInitialMatrix(geometry.boundingBox);
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

  updateProjectionRect(elem, geometry, matrix);
  useStlStore.getState().set({ geometry, id, matrix });
  updateElementColor(elem);

  const batchCmd = new history.BatchCommand('Import STL');

  batchCmd.addSubCommand(new history.InsertElementCommand(elem));
  // the mesh lives outside the DOM, so undo/redo has to add and remove it alongside the rect
  batchCmd.onAfter = () => {
    if (elem.parentNode) useStlStore.getState().set({ geometry, id, matrix });
    else useStlStore.getState().remove(id);
  };
  undoManager.addCommandToHistory(batchCmd);

  selectionManager.selectOnly([elem]);
  useStlStore.getState().setSelectedId(id);
};

export default importStl;
