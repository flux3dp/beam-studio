import alertCaller from '@core/app/actions/alert-caller';
import type { ConvertResultType } from '@core/app/actions/beambox/font-funcs';
import fontFuncs, { ConvertResult } from '@core/app/actions/beambox/font-funcs';
import alertConstants from '@core/app/constants/alert-constants';
import history, { BatchCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import textActions from '@core/app/svgedit/text/textactions';
import textedit from '@core/app/svgedit/text/textedit';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import alertConfig from './api/alert-config';
import i18n from './i18n';
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

type ConvertTextToPathResult = ConvertToPathResult & {
  status: ConvertResultType;
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
}): Promise<ConvertTextToPathResult> => {
  const isSubCommand = parentCommand !== undefined;

  if (textActions.isEditing) textActions.toSelectMode();

  const { command, path, status } = await fontFuncs.convertTextToPath(element, { isSubCommand: true, weldingTexts });

  if (command && isSubCommand) {
    parentCommand.addSubCommand(command);
  }

  if (command && !isSubCommand) {
    undoManager.addCommandToHistory(command);
  }

  if (path && isToSelect) {
    svgCanvas.selectOnly([path]);
  }

  return { bbox: path?.getBBox()!, command: parentCommand || command || undefined, path: path || undefined, status };
};

export const convertTextOnPathToPath = async ({
  element,
  isToSelect: _isToSelect,
  parentCommand,
  weldingTexts = false,
}: {
  element: SVGElement;
  isToSelect?: boolean;
  parentCommand?: IBatchCommand;
  weldingTexts?: boolean;
}): Promise<ConvertToPathResult & { group: SVGGElement }> => {
  const isSubCommand = Boolean(parentCommand);

  if (!parentCommand) parentCommand = new BatchCommand('Convert Text on Path to Path');

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

/**
 * Converts all <text> and text-on-path elements on the canvas to paths.
 * @returns A promise that resolves to a function that can revert the conversion.
 */
export const convertAllTextToPath = async (): Promise<{
  revert: () => void;
  success: boolean;
}> => {
  // 1. Create a master command to record all changes.
  const parentCommand = new history.BatchCommand('Convert All Text to Path');
  const texts = [
    ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
    ...document.querySelectorAll('#svg_defs text'),
  ] as SVGElement[];
  let isAnyFontUnsupported = false;

  for (const element of texts) {
    const { status } = await convertTextToPath({ element, parentCommand });

    if (status === ConvertResult.CANCEL_OPERATION) {
      return { revert: () => {}, success: false };
    }

    if (status === ConvertResult.UNSUPPORT) isAnyFontUnsupported = true;
  }

  /**
   * Reverts the conversion from text to paths.
   */
  const revert = () => {
    // The unapply method reverses the command. It requires an object with a
    // renderText function, which we can get from the editor's textActions.
    parentCommand.unapply({
      handleHistoryEvent: () => {},
      renderText: textedit.renderText,
    });
  };

  if (isAnyFontUnsupported && !alertConfig.read('skip_check_thumbnail_warning')) {
    await new Promise<void>((resolve) => {
      alertCaller.popUp({
        callbacks: () => resolve(),
        checkbox: {
          callbacks: () => {
            alertConfig.write('skip_check_thumbnail_warning', true);
            resolve();
          },
          text: i18n.lang.alert.dont_show_again,
        },
        message: i18n.lang.beambox.object_panels.text_to_path.check_thumbnail_warning,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    });
  }

  return {
    revert,
    success: true,
  };
};
