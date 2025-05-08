import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export enum VerticalAlign {
  BOTTOM = 0,
  MIDDLE = 1,
  TOP = 2,
}

function ungroupTextPath(gElement: SVGGElement): IBatchCommand {
  const batchCmd = new history.BatchCommand('Ungroup TextPath');
  const cmd = svgCanvas.pushGroupProperties(gElement, true);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  const parent = gElement.parentElement;
  const anchor = gElement.nextElementSibling;
  const { childNodes } = gElement;

  for (let i = childNodes.length - 1; i >= 0; i -= 1) {
    const child = childNodes[i];

    parent.insertBefore(child, anchor);
    batchCmd.addSubCommand(new history.MoveElementCommand(child, null, gElement));
  }
  batchCmd.addSubCommand(new history.RemoveElementCommand(gElement, anchor, parent));
  gElement.remove();

  return batchCmd;
}

function attachTextToPath(textElement: Element, pathElement: Element, isSubCmd = false): IBatchCommand {
  if (!pathElement.id) {
    pathElement.setAttribute('id', svgCanvas.getNextId());
  }

  const batchCmd = new history.BatchCommand('Attach Text to Path');
  const pathID = pathElement.id;
  const { textContent } = textElement;

  for (let i = textElement.children.length - 1; i >= 0; i -= 1) {
    const childNode = textElement.children[i];

    batchCmd.addSubCommand(new history.RemoveElementCommand(childNode as Element, childNode.nextSibling, textElement));
    childNode.remove();
  }

  const textPath = document.createElementNS(svgedit.NS.SVG, 'textPath');

  textPath.setAttribute('vector-effect', 'non-scaling-stroke');
  textPath.textContent = textContent;
  textPath.setAttribute('startOffset', '0%');
  textPath.setAttribute('href', `#${pathID}`);
  textElement.appendChild(textPath);
  batchCmd.addSubCommand(new history.InsertElementCommand(textPath));

  const originalX = textElement.getAttribute('x');
  const originalY = textElement.getAttribute('y');
  const originalTransform = textElement.getAttribute('transform');

  textElement.removeAttribute('x');
  textElement.removeAttribute('y');
  textElement.removeAttribute('transform');
  textElement.setAttribute('data-textpath', '1');
  textElement.setAttribute('data-origx', originalX);
  textElement.setAttribute('data-origy', originalY);
  batchCmd.addSubCommand(
    new history.ChangeElementCommand(textElement, {
      'data-origx': null,
      'data-origy': null,
      'data-textpath': null,
      transform: originalTransform,
      x: originalX,
      y: originalY,
    }),
  );

  const textPathGroup = document.createElementNS(svgedit.NS.SVG, 'g');

  textPathGroup.setAttribute('data-textpath-g', '1');
  pathElement.parentNode.insertBefore(textPathGroup, pathElement);
  batchCmd.addSubCommand(new history.InsertElementCommand(textPathGroup));

  let oldParent = pathElement.parentNode;
  let oldNextSib = pathElement.nextSibling;

  textPathGroup.appendChild(pathElement);
  batchCmd.addSubCommand(new history.MoveElementCommand(pathElement, oldNextSib, oldParent));

  oldParent = textElement.parentNode;
  oldNextSib = textElement.nextSibling;
  textPathGroup.appendChild(textElement);
  batchCmd.addSubCommand(new history.MoveElementCommand(textElement, oldNextSib, oldParent));

  textPathGroup.setAttribute('id', svgCanvas.getNextId());
  svgCanvas.selectOnly([textPathGroup]);

  if (!isSubCmd) {
    if (!batchCmd.isEmpty()) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }

    return null;
  }

  return batchCmd;
}

function detachText(
  element: SVGGElement,
  isSubCmd = false,
): {
  cmd?: IBatchCommand;
  path: SVGPathElement;
  text: SVGTextElement;
} {
  const batchCmd = new history.BatchCommand('Detatch');
  const text = element.querySelector('text');
  const path = element.querySelector('path');
  const originalX = text.getAttribute('data-origx');
  const originalY = text.getAttribute('data-origy');

  text.removeAttribute('data-textpath');
  text.removeAttribute('data-origx');
  text.removeAttribute('data-origy');
  text.setAttribute('x', originalX);
  text.setAttribute('y', originalY);
  batchCmd.addSubCommand(
    new history.ChangeElementCommand(text, {
      'data-origx': originalX,
      'data-origy': originalY,
      'data-textpath': '1',
      x: null,
      y: null,
    }),
  );

  const cmd = ungroupTextPath(element);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  const textPath = text.querySelector('textPath');
  const textContent = textPath?.textContent;

  textPath.remove();
  batchCmd.addSubCommand(new history.RemoveElementCommand(textPath, textPath.nextSibling, text));

  const tspan = document.createElementNS(svgedit.NS.SVG, 'tspan');

  text.appendChild(tspan);
  batchCmd.addSubCommand(new history.InsertElementCommand(tspan));
  tspan.textContent = textContent;

  if (!isSubCmd) {
    if (!batchCmd.isEmpty()) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }

    return { path, text };
  }

  return { cmd: batchCmd, path, text };
}

function editPath(element: SVGGElement): void {
  const path = element.querySelector('path');

  svgCanvas.pathActions.toEditMode(path);
}

const getStartOffset = (elem: SVGTextPathElement): number => {
  return Number.parseInt(elem.getAttribute('startOffset') || '0', 10);
};

const getVerticalAlign = (elem: SVGTextPathElement): VerticalAlign => {
  const alignmentBaseline = elem.getAttribute('alignment-baseline');

  if (alignmentBaseline === 'middle') return VerticalAlign.MIDDLE;

  if (alignmentBaseline === 'top') return VerticalAlign.TOP;

  return VerticalAlign.BOTTOM;
};

const setStartOffset = (val: number, elem: SVGGElement): void => {
  const textPaths = Array.from(elem.querySelectorAll('textPath'));

  svgCanvas.changeSelectedAttribute('startOffset', `${val}%`, textPaths);
};

const setVerticalAlign = (position: VerticalAlign, elem: SVGGElement): void => {
  const textPaths = Array.from(elem.querySelectorAll('textPath'));
  const batchCmd = new history.BatchCommand('Change Vertical Align');
  const attrMap = {
    [VerticalAlign.BOTTOM]: {
      'alignment-baseline': 'auto',
      'dominant-baseline': 'auto',
    },
    [VerticalAlign.MIDDLE]: {
      'alignment-baseline': 'middle',
      'dominant-baseline': 'middle',
    },
    [VerticalAlign.TOP]: {
      'alignment-baseline': 'top',
      'dominant-baseline': 'hanging',
    },
  }[position];
  let cmd: ICommand | null;

  Object.keys(attrMap).forEach((attr) => {
    svgCanvas.undoMgr.beginUndoableChange(attr, textPaths);
    svgCanvas.changeSelectedAttributeNoUndo(attr, attrMap[attr as keyof typeof attrMap], textPaths);
    cmd = svgCanvas.undoMgr.finishUndoableChange();

    if (cmd) batchCmd.addSubCommand(cmd);
  });
  undoManager.addCommandToHistory(batchCmd);
};

export default {
  attachTextToPath,
  detachText,
  editPath,
  getStartOffset,
  getVerticalAlign,
  setStartOffset,
  setVerticalAlign,
  ungroupTextPath,
};
