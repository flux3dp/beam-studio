import history from 'app/svgedit/history/history';
import selector from 'app/svgedit/selector';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand, ICommand } from 'interfaces/IHistory';

const { svgedit } = window;

let svgCanvas;
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

function attachTextToPath(
  textElement: Element, pathElement: Element, isSubCmd = false,
): IBatchCommand {
  if (!pathElement.id) {
    pathElement.setAttribute('id', svgCanvas.getNextId());
  }
  const batchCmd = new history.BatchCommand('Attach Text to Path');
  const pathID = pathElement.id;
  const { textContent } = textElement;
  for (let i = textElement.children.length - 1; i >= 0; i -= 1) {
    const childNode = textElement.children[i];
    batchCmd.addSubCommand(new history.RemoveElementCommand(
      childNode as Element, childNode.nextSibling, textElement,
    ));
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
  batchCmd.addSubCommand(new history.ChangeElementCommand(textElement, {
    x: originalX,
    y: originalY,
    transform: originalTransform,
    'data-textpath': null,
    'data-origx': null,
    'data-origy': null,
  }));

  const textPathGroup = document.createElementNS(svgedit.NS.SVG, 'g');
  textPathGroup.setAttribute('data-textpath-g', '1');
  pathElement.parentNode.insertBefore(textPathGroup, pathElement);
  batchCmd.addSubCommand(new history.InsertElementCommand(textPathGroup));

  let oldParent = pathElement.parentNode;
  let oldNextSib = pathElement.nextSibling;
  textPathGroup.appendChild(pathElement);
  batchCmd.addSubCommand(new history.MoveElementCommand(
    pathElement, oldNextSib, oldParent,
  ));

  oldParent = textElement.parentNode;
  oldNextSib = textElement.nextSibling;
  textPathGroup.appendChild(textElement);
  batchCmd.addSubCommand(new history.MoveElementCommand(
    textElement, oldNextSib, oldParent,
  ));

  textPathGroup.setAttribute('id', svgCanvas.getNextId());
  svgCanvas.selectOnly([textPathGroup]);
  if (!isSubCmd) {
    if (!batchCmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    return null;
  }
  return batchCmd;
}

function detachText(element: SVGGElement, isSubCmd = false): {
  cmd?: IBatchCommand,
  text: SVGTextElement,
  path: SVGPathElement,
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
  batchCmd.addSubCommand(new history.ChangeElementCommand(text, {
    x: null,
    y: null,
    'data-textpath': '1',
    'data-origx': originalX,
    'data-origy': originalY,
  }));

  const cmd = ungroupTextPath(element);
  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
  const textPath = text.querySelector('textPath');
  const textContent = textPath?.textContent;
  textPath.remove();
  batchCmd.addSubCommand(new history.RemoveElementCommand(
    textPath, textPath.nextSibling, text,
  ));
  const tspan = document.createElementNS(svgedit.NS.SVG, 'tspan');
  text.appendChild(tspan);
  batchCmd.addSubCommand(new history.InsertElementCommand(tspan));
  tspan.textContent = textContent;

  if (!isSubCmd) {
    if (!batchCmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    return { text, path };
  }
  return { cmd: batchCmd, text, path };
}

function editPath(element: SVGGElement): void {
  const path = element.querySelector('path');
  svgCanvas.pathActions.toEditMode(path);
}

const setStartOffset = (val: number, elem: SVGTextElement): void => {
  const textPath = elem.querySelector('textPath');
  svgCanvas.changeSelectedAttribute('startOffset', `${val}%`, [textPath]);
  const selectorManager = selector.getSelectorManager();
  selectorManager.requestSelector(elem.parentElement).resize();
};

function setVerticalAlign(textElement: Element, position: VerticalAlign): ICommand {
  const textPath = textElement.querySelector('textPath');
  const originalDominantBaseline = textPath.getAttribute('dominant-baseline');
  const originalAlignmentBaseline = textPath.getAttribute('alignment-baseline');
  if (position === VerticalAlign.BOTTOM) {
    textPath.removeAttribute('dominant-baseline');
    textPath.removeAttribute('alignment-baseline');
  } else if (position === VerticalAlign.MIDDLE) {
    textPath.setAttribute('dominant-baseline', 'middle');
    textPath.setAttribute('alignment-baseline', 'middle');
  } else if (position === VerticalAlign.TOP) {
    textPath.setAttribute('dominant-baseline', 'hanging');
    textPath.setAttribute('alignment-baseline', 'top');
  } else {
    throw new Error('Bad_Parameter');
  }
  const selectorManager = selector.getSelectorManager();
  selectorManager.resizeSelectors([textElement, textElement.parentElement]);
  const cmd = new history.ChangeElementCommand(textPath, {
    'dominant-baseline': originalDominantBaseline,
    'alignment-baseline': originalAlignmentBaseline,
  });

  return cmd;
}

export default {
  ungroupTextPath,
  attachTextToPath,
  detachText,
  editPath,
  setStartOffset,
  setVerticalAlign,
};
