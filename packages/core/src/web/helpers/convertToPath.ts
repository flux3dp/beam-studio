import fontFuncs from '@core/app/actions/beambox/font-funcs';
import history, { BatchCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import textActions from '@core/app/svgedit/text/textactions';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from './svg-editor-helper';

type ConvertToPathParams = {
  element: SVGElement;
  isToSelect?: boolean;
  parentCommand?: IBatchCommand;
};

type ConvertToPathResult = {
  bbox: DOMRect;
  command: IBatchCommand | undefined;
  path?: SVGPathElement;
};

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgedit = Edit;
});

export const convertSvgToPath = async ({
  element,
  isToSelect = false,
  parentCommand = new BatchCommand('convertSvgToPath'),
}: ConvertToPathParams): Promise<ConvertToPathResult> => {
  const { cmd, path } = svgCanvas.convertToPath(element, true);

  if (isToSelect) {
    svgCanvas.selectOnly([path]);
  }

  parentCommand.addSubCommand(cmd);
  undoManager.addCommandToHistory(parentCommand);

  return { bbox: path.getBBox(), command: parentCommand, path };
};

export const convertTextToPath = async ({
  element,
  isToSelect = false,
  parentCommand,
  weldingTexts = false,
}: {
  element: SVGElement;
  isToSelect?: boolean;
  parentCommand?: IBatchCommand;
  weldingTexts?: boolean;
}): Promise<ConvertToPathResult> => {
  const isSubCommand = parentCommand !== undefined;

  if (textActions.isEditing) textActions.toSelectMode();

  const { command, path } = await fontFuncs.convertTextToPath(element, { isSubCommand: true, weldingTexts });

  if (command && isSubCommand) {
    parentCommand.addSubCommand(command);
  }

  if (command && !isSubCommand) {
    undoManager.addCommandToHistory(command);
  }

  if (path && isToSelect) {
    svgCanvas.multiSelect([path].filter(Boolean) as SVGElement[]);
  }

  return { bbox: path?.getBBox()!, command: parentCommand || command || undefined, path: path || undefined };
};

export const convertTextOnPathToPath = async ({
  element,
  isToSelect: _isToSelect,
  parentCommand = new BatchCommand('Convert Text on Path to Path'),
  weldingTexts = false,
}: {
  element: SVGElement;
  isToSelect?: boolean;
  parentCommand?: IBatchCommand;
  weldingTexts?: boolean;
}): Promise<ConvertToPathResult & { group: SVGGElement }> => {
  const isSubCommand = parentCommand.getText() !== 'Convert Text on Path to Path';
  const pathElement = element.querySelector('path');
  const textElement = element.querySelector('text');

  if (textActions.isEditing) textActions.toSelectMode();

  svgCanvas.clearSelection();

  const { command, path } = await fontFuncs.convertTextToPath(textElement!, { isSubCommand, weldingTexts });

  svgCanvas.selectOnly([pathElement!, path!]);

  const { command: groupCmd, group } = svgCanvas.groupSelectedElements(true)!;

  if (command) parentCommand.addSubCommand(command);

  if (groupCmd) parentCommand.addSubCommand(groupCmd);

  if (!isSubCommand) undoManager.addCommandToHistory(parentCommand);

  return {
    bbox: path!.getBBox(),
    command: parentCommand,
    group,
    path: path || undefined,
  };
};

export const convertUseToPath = async ({
  element,
  isToSelect = false,
}: {
  element: SVGElement;
  isToSelect?: boolean;
}): Promise<ConvertToPathResult> => {
  const command = (await disassembleUse([element], {
    addToHistory: false,
    showProgress: false,
    skipConfirm: true,
  })) as BatchCommand;

  const group = svgCanvas.getSelectedElems()[0];

  if (!(group instanceof SVGGElement)) {
    return convertSvgToPath({ element: group, parentCommand: command });
  }

  const head = group.childNodes[0] as SVGPathElement;
  const pathData = Array.of<string>();
  const toRemove = Array.of<SVGElement>();

  group.childNodes.forEach((child, index) => {
    pathData.push((child as SVGPathElement).getAttribute('d')!);

    if (index !== 0) toRemove.push(child as SVGElement);
  });

  command.addSubCommand(deleteElements(toRemove, true));

  head.setAttribute('d', pathData.join(' '));
  head.removeAttribute('data-next-sibling');

  if (isToSelect) {
    svgCanvas.selectOnly([head]);
  }

  return { bbox: head.getBBox(), command, path: head };
};

export const generateImageRect = (element?: SVGImageElement): { command?: IBatchCommand; rect?: SVGElement } => {
  if (!element) {
    return { command: undefined, rect: undefined };
  }

  const batchCommand = new history.BatchCommand('Generate Image Rect');
  const bbox = element.getBBox();
  const rotation = svgedit.utilities.getRotationAngle(element);
  const rect = svgCanvas.addSvgElementFromJson({
    attr: {
      fill: 'none',
      height: bbox.height,
      id: svgCanvas.getNextId(),
      rotation,
      stroke: '#000000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
      width: bbox.width,
      x: bbox.x,
      y: bbox.y,
    },
    element: 'rect',
  });

  batchCommand.addSubCommand(new history.InsertElementCommand(rect));

  return { command: batchCommand, rect };
};
