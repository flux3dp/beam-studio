import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import { removeElement } from '@core/app/svgedit/history/removeElement';
import selectionManager from '@core/app/svgedit/selection';
import selector from '@core/app/svgedit/selector';
import findDefs from '@core/app/svgedit/utils/findDef';
import { getContentElements } from '@core/helpers/contentLibrary/manager';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { HistoryActionOptions, IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { handleHistoryActionOptions } from '../history/utils/handleHistoryActionOptions';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * deleteUseRef
 * check if the ref of the use element is not used by other use elements, if not, delete the ref
 * called after deleting a use element
 * @param use UseElement
 */
export const deleteUseRef = (use: SVGUseElement, opts?: HistoryActionOptions): { cmd: IBatchCommand } => {
  const refId = svgCanvas.getHref(use);
  const svgcontent = document.getElementById('svgcontent')!;
  const isReferred = svgcontent.querySelector(`use[*|href="${refId}"]`);
  const batchCmd = new history.BatchCommand(`Delete Use ${use.id} Ref`);

  if (!isReferred) {
    const defs = findDefs();
    const refElement = defs.querySelector(refId);

    if (refElement) {
      let { nextSibling, parentNode } = refElement;

      parentNode?.removeChild(refElement);
      batchCmd.addSubCommand(new history.RemoveElementCommand(refElement, nextSibling!, parentNode!));

      const relatedIds = [refElement.getAttribute('data-image-symbol'), refElement.getAttribute('data-origin-symbol')];

      relatedIds.forEach((id) => {
        const element = id ? document.getElementById(id) : null;

        if (element) {
          ({ nextSibling, parentNode } = element);
          parentNode?.removeChild(element);
          batchCmd.addSubCommand(new history.RemoveElementCommand(element, nextSibling!, parentNode!));
        }
      });
    }
  }

  handleHistoryActionOptions(batchCmd, opts);

  return { cmd: batchCmd };
};

export const deleteLibraryRef = (owner: Element, opts?: HistoryActionOptions) => {
  getContentElements({ ownerId: owner.id }).forEach((elem) => {
    handleHistoryActionOptions(removeElement(elem), opts);
  });
};

export const deleteElements = (elems: Element[], isSub = false): IBatchCommand => {
  const selectorManager = selector.getSelectorManager();
  const batchCmd = new history.BatchCommand('Delete Elements');
  const deletedElems = [];

  for (const elem of elems) {
    if (!elem || !elem?.tagName) {
      break;
    }

    // this will unselect the element and remove the selectedOutline
    selectorManager.releaseSelector(elem);
    // Remove the path if present.
    svgedit.path.removePath_(elem.id);

    let parent = elem.parentNode as Element;
    let elemToRemove = elem;

    // Get the parent if it's a single-child anchor
    if (parent?.tagName === 'a' && parent?.childNodes.length === 1) {
      elemToRemove = parent;
      parent = parent.parentNode as Element;
    }

    const { nextSibling } = elemToRemove;

    if (parent == null) {
      console.warn('The element has no parent', elem.id, elem.tagName);
    } else {
      parent.removeChild(elemToRemove);
      deletedElems.push(elem); // for the copy
      batchCmd.addSubCommand(new history.RemoveElementCommand(elemToRemove, nextSibling!, parent));
    }

    if (elem.tagName === 'use') {
      deleteUseRef(elem as SVGUseElement, { parentCmd: batchCmd });
    }

    deleteLibraryRef(elem, { parentCmd: batchCmd });
  }

  if (!batchCmd.isEmpty() && !isSub) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }

  svgCanvas.call('changed', deletedElems);
  selectionManager.clearSelection();
  useLayerStore.getState().checkVector();
  useLayerStore.getState().checkGradient();

  return batchCmd;
};

export const deleteSelectedElements = (isSub = false): IBatchCommand => {
  const selectedElems = selectionManager.getSelectedElements(true);

  return deleteElements(selectedElems, isSub);
};

export default {
  deleteElements,
  deleteSelectedElements,
};
