import history from 'app/svgedit/history/history';
import selector from 'app/svgedit/selector';
import workareaManager from 'app/svgedit/workarea';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

// TODO: decouple with svgcanvas

const { svgedit } = window;

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export function moveElements(
  dx: number | number[],
  dy: number | number[],
  elems: Element[],
  undoable = true,
  noCall = false
): IBatchCommand {
  // if single values, scale them to the zoom
  let zoomedX: number;
  let zoomedY: number;
  if (typeof dx === 'number' && typeof dy === 'number') {
    const currentZoom = workareaManager.zoomRatio;
    zoomedX = dx / currentZoom;
    zoomedY = dy / currentZoom;
  }

  const batchCmd = new history.BatchCommand('Move Elements');
  for (let i = elems.length; i >= 0; i -= 1) {
    const selected = elems[i];
    if (selected) {
      svgCanvas.unsafeAccess.setStartTransform(selected.getAttribute('transform'));
      const svgroot = document.getElementById('svgroot') as unknown as SVGSVGElement;
      const xform = svgroot.createSVGTransform();
      const tlist = svgedit.transformlist.getTransformList(selected);
      let x = 0;
      let y = 0;
      // dx and dy could be arrays
      if (typeof dx === 'number' && typeof dy === 'number') {
        x = zoomedX;
        y = zoomedY;
      } else {
        x = dx[i];
        y = dy[i];
      }
      xform.setTranslate(x, y);

      if (tlist.numberOfItems) {
        tlist.insertItemBefore(xform, 0);
      } else {
        tlist.appendItem(xform);
      }

      const cmd = svgedit.recalculate.recalculateDimensions(selected);
      if (cmd && !cmd.isEmpty() && (x !== 0 || y !== 0)) {
        batchCmd.addSubCommand(cmd);
      }
    }
  }
  if (!batchCmd.isEmpty()) {
    if (undoable) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    if (!noCall) svgCanvas.call('changed', elems);
    return batchCmd;
  }
  return null;
}

export function moveSelectedElements(
  dx: number | number[],
  dy: number | number[],
  undoable = true
): IBatchCommand {
  // if single values, scale them to the zoom
  const selectedElements = svgCanvas.getSelectedElems();
  const batchCmd = moveElements(dx, dy, selectedElements, undoable);
  const selectorManager = selector.getSelectorManager();
  selectedElements.forEach((elem: Element) => {
    selectorManager.requestSelector(elem).resize();
  });

  if (batchCmd && !batchCmd.isEmpty()) {
    if (undoable) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }
    svgCanvas.call('changed', selectedElements);
    return batchCmd;
  }
  return null;
}

export default {
  moveElements,
  moveSelectedElements,
};
