import findDefs from 'app/svgedit/utils/findDef';
import history from 'app/svgedit/history/history';
import selector from 'app/svgedit/selector';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

const { svgedit } = window;

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

/**
 * deleteUseRef
 * check if the ref of the use element is not used by other use elements, if not, delete the ref
 * called after deleting a use element
 * @param use UseElement
 */
export const deleteUseRef = (
  use: SVGUseElement,
  opts?: { parentCmd?: IBatchCommand; addToHistory?: boolean }
): { cmd: IBatchCommand } => {
  const refId = svgCanvas.getHref(use);
  const svgcontent = document.getElementById('svgcontent');
  const isReferred = svgcontent.querySelector(`use[*|href="${refId}"]`);
  const batchCmd = new history.BatchCommand(`Delete Use ${use.id} Ref`);
  const { parentCmd, addToHistory = true } = opts || {};
  if (!isReferred) {
    const defs = findDefs();
    const refElement = defs.querySelector(refId);
    if (refElement) {
      let { parentNode, nextSibling } = refElement;
      parentNode.removeChild(refElement);
      batchCmd.addSubCommand(new history.RemoveElementCommand(refElement, nextSibling, parentNode));

      const relatedIds = [
        refElement.getAttribute('data-image-symbol'),
        refElement.getAttribute('data-origin-symbol'),
      ];
      relatedIds.forEach((id) => {
        const element = id ? document.getElementById(id) : null;
        if (element) {
          ({ parentNode, nextSibling } = element);
          parentNode.removeChild(element);
          batchCmd.addSubCommand(
            new history.RemoveElementCommand(element, nextSibling, parentNode)
          );
        }
      });
    }
  }
  if (!batchCmd.isEmpty()) {
    if (parentCmd) {
      parentCmd.addSubCommand(batchCmd);
    } else if (addToHistory) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }
  }
  return { cmd: batchCmd };
};

export const deleteElements = (elems: Element[], isSub = false): IBatchCommand => {
  const selectorManager = selector.getSelectorManager();
  const batchCmd = new history.BatchCommand('Delete Elements');
  const deletedElems = [];
  for (let i = 0; i < elems.length; i += 1) {
    const elem = elems[i];
    if (!elem) {
      break;
    }

    // this will unselect the element and remove the selectedOutline
    selectorManager.releaseSelector(elem);
    // Remove the path if present.
    // eslint-disable-next-line no-underscore-dangle
    svgedit.path.removePath_(elem.id);

    let parent = elem.parentNode as Element;
    let elemToRemove = elem;

    // Get the parent if it's a single-child anchor
    if (parent.tagName === 'a' && parent.childNodes.length === 1) {
      elemToRemove = parent;
      parent = parent.parentNode as Element;
    }

    const { nextSibling } = elemToRemove;
    if (parent == null) {
      // eslint-disable-next-line no-console
      console.warn('The element has no parent', elem);
    } else {
      parent.removeChild(elemToRemove);
      deletedElems.push(elem); // for the copy
      batchCmd.addSubCommand(new history.RemoveElementCommand(elemToRemove, nextSibling, parent));
    }
    if (elem.tagName === 'use') {
      deleteUseRef(elem as SVGUseElement, { parentCmd: batchCmd });
    }
  }
  if (!batchCmd.isEmpty() && !isSub) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }
  svgCanvas.call('changed', deletedElems);
  svgCanvas.clearSelection();

  return batchCmd;
};

export const deleteSelectedElements = (isSub = false): IBatchCommand => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();
  return deleteElements(selectedElems, isSub);
};

export default {
  deleteElements,
  deleteSelectedElements,
};
