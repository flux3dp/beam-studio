import tutorialController from '@core/app/components/tutorials/tutorialController';
import { CanvasElements } from '@core/app/constants/canvasElements';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';

export const calcPathClosed = (pathElem: SVGPathElement) => {
  const segList = pathElem.pathSegList._list || pathElem.pathSegList;
  let [startX, startY, currentX, currentY, isDrawing, isClosed] = [0, 0, 0, 0, false, true];

  for (let i = 0; i < segList.length; i++) {
    const seg = segList[i];

    switch (seg.pathSegType) {
      case 1:
        [currentX, currentY] = [startX, startY];
        isDrawing = false;
        break;
      case 2:
      case 3:
        if (isDrawing) {
          if (seg.x !== currentX || seg.y !== currentY) {
            isClosed = false;
          } else {
            [startX, startY, currentX, currentY] = [seg.x, seg.y, seg.x, seg.y];
          }
        } else {
          [startX, startY, currentX, currentY] = [seg.x, seg.y, seg.x, seg.y];
        }

        break;
      default:
        isDrawing = true;
        [currentX, currentY] = [seg.x, seg.y];
        break;
    }

    if (!isClosed) {
      break;
    }
  }

  if (isDrawing && (startX !== currentX || startY !== currentY)) {
    isClosed = false;
  }

  return isClosed;
};

export const isElemFillable = (elem: Element) => {
  if (elem.tagName === 'g') {
    const childNodes = elem.children;

    for (let i = 0; i < childNodes.length; i++) {
      if (!isElemFillable(childNodes[i])) {
        return false;
      }
    }

    return true;
  }

  if (!CanvasElements.fillableElems.includes(elem.tagName)) {
    return false;
  }

  return elem.tagName === 'path' ? calcPathClosed(elem as SVGPathElement) : true;
};

export const calcElemFilledInfo = (elem: Element) => {
  if (elem.tagName === 'g') {
    const childNodes = elem.children;
    let isAnyFilled = false;
    let isAllFilled = true;

    for (let i = 0; i < childNodes.length; i++) {
      const childFilledInfo = calcElemFilledInfo(childNodes[i]);

      if (childFilledInfo.isAnyFilled) {
        isAnyFilled = true;
      }

      if (!childFilledInfo.isAllFilled) {
        isAllFilled = false;
      }

      if (isAnyFilled && isAllFilled === false) {
        break;
      }
    }

    return { isAllFilled, isAnyFilled };
  }

  if (!CanvasElements.fillableElems.includes(elem.tagName)) {
    return {
      isAllFilled: false,
      isAnyFilled: false,
    };
  }

  const fill = elem.getAttribute('fill') || '#000000';
  const isFilled =
    Number.parseFloat(elem.getAttribute('fill-opacity') ?? '1') !== 0 &&
    !['#fff', '#ffffff', 'none'].includes(fill.toLowerCase());

  return {
    isAllFilled: isFilled,
    isAnyFilled: isFilled,
  };
};

export const calcElemsFilledInfo = (elems: Element[]) => {
  let isFillable = elems.length > 0;
  let isAllFilled = true;
  let isAnyFilled = false;

  for (const element of elems) {
    isFillable = isElemFillable(element);

    if (!isFillable) break;

    const { isAllFilled: subIsAllFilled, isAnyFilled: subIsAnyFilled } = calcElemFilledInfo(element);

    isAllFilled = isAllFilled && subIsAllFilled;
    isAnyFilled = isAnyFilled || subIsAnyFilled;
  }

  return {
    isAllFilled,
    isAnyFilled,
    isFillable,
  };
};

export const setElementFill = (elem: SVGElement, color: string) => {
  const batchCmd = new history.BatchCommand('set elem fill');
  let cmd;

  undoManager.beginUndoableChange('fill', [elem]);
  elem.setAttribute('fill', color);
  cmd = undoManager.finishUndoableChange();

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  undoManager.beginUndoableChange('fill-opacity', [elem]);
  elem.setAttribute('fill-opacity', '1');
  cmd = undoManager.finishUndoableChange();

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  return batchCmd;
};

export const setElemsFill = (elems: Element[] | HTMLCollection) => {
  const batchCmd = new history.BatchCommand('set elems fill');

  for (let i = 0; i < elems.length; ++i) {
    const elem = elems[i];

    if (elem == null) {
      break;
    }

    if (CanvasElements.fillableElems.includes(elem.tagName)) {
      if (calcElemFilledInfo(elem).isAllFilled) {
        continue;
      }

      const color = $(elem).attr('stroke') || '#333';
      const cmd = setElementFill(elem as SVGElement, color);

      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    } else if (elem.tagName === 'g') {
      setElemsFill(elem.children);
    } else {
      console.log(`Not support type: ${elem.tagName}`);
    }
  }

  if (tutorialController.getNextStepRequirement() === tutorialConstants.INFILL) {
    tutorialController.handleNextStep();
  }

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};

export const setElementUnfill = (elem: SVGElement, color: string) => {
  const batchCmd = new history.BatchCommand('set elem unfill');
  let cmd;

  undoManager.beginUndoableChange('stroke', [elem]);
  elem.setAttribute('stroke', color);
  cmd = undoManager.finishUndoableChange();

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  undoManager.beginUndoableChange('fill-opacity', [elem]);
  elem.setAttribute('fill-opacity', '0');
  cmd = undoManager.finishUndoableChange();

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  undoManager.beginUndoableChange('fill', [elem]);
  elem.setAttribute('fill', 'none');
  cmd = undoManager.finishUndoableChange();

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  return batchCmd;
};

export const setElemsUnfill = (elems: Element[] | HTMLCollection) => {
  const batchCmd = new history.BatchCommand('set elems unfill');

  for (let i = 0; i < elems.length; ++i) {
    const elem = elems[i];

    if (elem == null) {
      break;
    }

    if (CanvasElements.fillableElems.includes(elem.tagName)) {
      if (!calcElemFilledInfo(elem).isAnyFilled) {
        continue;
      }

      const color = $(elem).attr('fill') || '#333';
      const cmd = setElementUnfill(elem as SVGElement, color);

      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    } else if (elem.tagName === 'g') {
      setElemsUnfill(elem.children);
    } else {
      console.log(`Not support type: ${elem.tagName}`);
    }
  }

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
