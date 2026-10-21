import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { StlObject } from '@core/app/stores/stlStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { moveElements } from '@core/app/svgedit/operations/move';
import selectionManager from '@core/app/svgedit/selection';
import selector from '@core/app/svgedit/selector';
import { createPastedStlObject } from '@core/app/svgedit/stl/clipboard';
import { is3dProjection } from '@core/app/svgedit/stl/getters';
import { convertPastedTo3d, get2dCounterpart } from '@core/app/svgedit/stl/pasteConversion';
import { syncStlObjectsWithDom } from '@core/app/svgedit/stl/sync';
import { getBBoxFromElements } from '@core/app/svgedit/utils/getBBox';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';
import { handlePastedRef } from '../helpers/paste';
import { clipboardCore } from '../singleton';
import { updateSignatureClipboardCommand, useClipboardStore } from '../useClipboardStore';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

let dataCache: Element[] | null = null;

export const clearCache = () => {
  dataCache = null;
};

/** Why elements on the clipboard were not pasted, so the user can be told once per paste. */
interface SkippedPaste {
  /** 3D objects with nothing 2D behind them (a mesh from an STL file, a point cloud) */
  no2dVersion: number;
  /** 2D elements the inner engraving canvas cannot extrude */
  notExtrudable: number;
  /** 3D objects copied in another tab, which cannot carry their mesh */
  otherTab: number;
}

const showSkippedPasteAlert = ({ no2dVersion, notExtrudable, otherTab }: SkippedPaste): void => {
  const t = i18n.lang.inner_engraving;
  const messages = [
    otherTab ? t.paste_from_other_tab : null,
    no2dVersion ? t.paste_no_2d_version : null,
    notExtrudable ? t.paste_not_extrudable : null,
  ].filter((message): message is string => Boolean(message));

  if (!messages.length) return;

  alertCaller.popUp({ id: 'paste-3d-skipped', message: messages.join('\n'), type: alertConstants.SHOW_POPUP_WARNING });
};

export const pasteElements = async ({
  isSubCmd = false,
  selectElement = true,
  type,
  useCache = false,
  x,
  y,
}: {
  isSubCmd?: boolean;
  selectElement?: boolean;
  type: 'coordinate' | 'inPlace' | 'mouse';
  /**
   * For array, use cached clipboard data to avoid multiple reads
   */
  useCache?: boolean;
  x?: number;
  y?: number;
}): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const clipboard = useCache && dataCache ? dataCache : await clipboardCore.getData();

  if (!clipboard?.length) {
    return null;
  }

  if (!useCache || !dataCache) dataCache = clipboard;

  const pasted = Array.of<SVGGElement>();
  // the projection rects among `pasted`, paired with the object they were copied from: their mesh
  // has to be rebuilt once the paste offset is known
  const pastedStl = Array.of<{ copy: SVGElement; source: StlObject }>();
  // 3D objects made out of pasted 2D elements: the conversion places them, not the paste offset
  const converted = new Set<Element>();
  // photo planes among `converted`: their mesh is not carried by any element command either
  const convertedPhotos = Array.of<StlObject>();
  const skipped: SkippedPaste = { no2dVersion: 0, notExtrudable: 0, otherTab: 0 };
  const innerEngraving = isInnerEngravingActive();
  const batchCmd = new history.BatchCommand('Paste elements');
  const drawing = svgCanvas.getCurrentDrawing();

  for (const elem of clipboard) {
    if (!elem) continue;

    const is3d = is3dProjection(elem);
    const stlSource = is3d ? clipboardCore.getStlFromClipboard(elem.id) : undefined;

    if (is3d && !stlSource) {
      // no mesh to attach — copied in another tab, which cannot carry one. A rect on its own is a
      // broken STL object (invisible in 3D, and it would fail to export), so it is not pasted.
      skipped.otherTab += 1;
      continue;
    }

    // a 3D object pasted on a 2D canvas is pasted as the 2D element it was made from
    const to2d = Boolean(stlSource) && !innerEngraving;
    const source = to2d ? get2dCounterpart(elem, stlSource!) : elem;

    if (!source) {
      skipped.no2dVersion += 1;
      continue;
    }

    const copy = drawing.copyElem(source) as SVGGElement;

    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    pasted.push(copy);

    if (stlSource && !to2d) pastedStl.push({ copy: copy as unknown as SVGElement, source: stlSource });

    let targetLayer = layerManager.getCurrentLayer()!;

    if (copy.getAttribute('data-origin-layer') && clipboard.length > 1) {
      const layer = layerManager.getLayerByName(copy.getAttribute('data-origin-layer')!);

      if (layer) targetLayer = layer;
    }

    targetLayer.appendChildren([copy]);

    const promise = handlePastedRef(copy);

    batchCmd.addSubCommand(new history.InsertElementCommand(copy));
    (svgCanvas as any).restoreRefElems(copy);
    promise.then(() => {
      updateElementColor(copy);
    });

    if (to2d) {
      // the 2D source sits wherever its own markup puts it; bring it to where the 3D object's
      // projection rect was, so the paste lands where the copy was taken from
      const bbox = getBBoxFromElements([copy], { ignoreRotation: false, withStroke: false });
      const rectX = Number(elem.getAttribute('x')) + Number(elem.getAttribute('width')) / 2;
      const rectY = Number(elem.getAttribute('y')) + Number(elem.getAttribute('height')) / 2;
      const cmd = moveElements(
        [rectX - bbox.x - bbox.width / 2],
        [rectY - bbox.y - bbox.height / 2],
        [copy],
        false,
        true,
      );

      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    }
  }

  if (innerEngraving) {
    // 2D elements have nowhere to go on the inner engraving canvas as they are: they are extruded
    // (an image laid flat as a photo plane) exactly as the element panel and the text tool do
    for (const copy of [...pasted]) {
      if (is3dProjection(copy)) continue;

      const object = await convertPastedTo3d(copy as unknown as SVGElement, batchCmd);
      const index = pasted.indexOf(copy);

      if (!object) {
        skipped.notExtrudable += 1;
        batchCmd.addSubCommand(new history.RemoveElementCommand(copy, copy.nextSibling, copy.parentNode!));
        copy.remove();
        pasted.splice(index, 1);
        continue;
      }

      const elem = document.getElementById(object.id) as unknown as SVGGElement;

      pasted.splice(index, 1, elem);
      converted.add(elem);

      if (object.kind === 'photo') convertedPhotos.push(object);
    }
  }

  if (!pasted.length) {
    showSkippedPasteAlert(skipped);

    return null;
  }

  if (selectElement) selectionManager.selectOnly(pasted, true);

  // the paste offset applies to what landed as pasted; converted 3D objects are already placed
  const movable = pasted.filter((elem) => !converted.has(elem));

  let dx: number | undefined;
  let dy: number | undefined;

  if (type === 'inPlace' && (x !== undefined || y !== undefined)) {
    // Paste in place with an offset
    dx = x;
    dy = y;
  } else if (type === 'mouse' || type === 'coordinate') {
    // Paste at a specific point (mouse or coordinate)
    let ctrX = 0;
    let ctrY = 0;

    if (type === 'mouse') {
      const lastClickPoint = (svgCanvas as any).getLastClickPoint();

      ctrX = lastClickPoint.x;
      ctrY = lastClickPoint.y;
    } else {
      ctrX = x!;
      ctrY = y!;
    }

    const bbox = getBBoxFromElements(movable, { ignoreRotation: false, withStroke: true });

    dx = ctrX - (bbox.x + bbox.width / 2);
    dy = ctrY - (bbox.y + bbox.height / 2);
  }

  // Apply the move command if an offset is calculated
  if (dx !== undefined && dy !== undefined && movable.length) {
    const dxArr = Array(movable.length).fill(dx);
    const dyArr = Array(movable.length).fill(dy);
    const cmd = moveElements(dxArr, dyArr, movable, false, true);

    batchCmd.addSubCommand(cmd);
  }

  // after the move, so the offset the rects actually received is what gets routed into the 3D
  // transforms. The mesh is not in the DOM and no element command can carry it, so undo and redo
  // put it back through `onAfter` (see `stl/sync.ts`).
  const objects = [...pastedStl.map(({ copy, source }) => createPastedStlObject(copy, source)), ...convertedPhotos];

  if (objects.length) {
    syncStlObjectsWithDom(objects);
    batchCmd.onAfter = () => syncStlObjectsWithDom(objects);
  }

  if (!isSubCmd) {
    undoManager.addCommandToHistory(batchCmd);
    svgCanvas.call('changed', pasted);
  }

  if (selectElement) {
    if (pasted.length === 1) {
      const selectorManager = selector.getSelectorManager();

      selectorManager.requestSelector(pasted[0])?.resize();
    } else {
      selectionManager.tempGroupSelectedElements();
    }
  }

  showSkippedPasteAlert(skipped);

  return { cmd: batchCmd, elems: pasted };
};

/**
 * Pastes elements from the clipboard.
 * - If pasting the same content consecutively, applies an incremental offset.
 * - If pasting new content, resets the offset.
 * - If pasting from another tab, pastes in place without an offset.
 * @param x - The horizontal offset. Defaults to 100.
 * @param y - The vertical offset. Defaults to 100.
 */
export const pasteWithDefaultPosition = async (
  x = 100,
  y = 100,
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const batchCommand = new history.BatchCommand('Paste elements with default position');
  const rawData = await clipboardCore.getRawData();

  if (!rawData) {
    return null;
  }

  const dataId = rawData.id;

  if (!dataId) {
    return null;
  }

  const updateSignatureCommand = new updateSignatureClipboardCommand(dataId);

  useClipboardStore.getState().updateSignature(dataId);

  const consecutivePasteCounter = useClipboardStore.getState().counter;
  const offsetX = x * consecutivePasteCounter;
  const offsetY = y * consecutivePasteCounter;
  const pasteCommand = await pasteElements({ isSubCmd: true, type: 'inPlace', x: offsetX, y: offsetY });

  batchCommand.addSubCommand(updateSignatureCommand);
  batchCommand.addSubCommand(pasteCommand?.cmd!);

  undoManager.addCommandToHistory(batchCommand);
  svgCanvas.call('changed', pasteCommand?.elems!);

  return { cmd: batchCommand, elems: pasteCommand?.elems! };
};
