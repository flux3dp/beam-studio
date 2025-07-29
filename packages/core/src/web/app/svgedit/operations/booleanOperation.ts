import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import alertConstants from '@core/app/constants/alert-constants';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { deleteElements } from './delete';
import { booleanOperationByPaperjs, fixEnd } from './pathActions';

export type BooleanOperationMode = 'diff' | 'intersect' | 'union' | 'xor';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const doBooleanOperation = (
  elements: SVGElement[],
  mode: BooleanOperationMode,
  { addToHistory = true, parentCmd }: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
): void => {
  let len = elements.length;

  if (len < 2) {
    alertCaller.popUp({
      id: 'Boolean Operate',
      message: i18n.lang.beambox.popup.select_at_least_two,
      type: alertConstants.SHOW_POPUP_ERROR,
    });

    return;
  }

  if (len > 2 && mode === 'diff') {
    alertCaller.popUp({
      id: 'Boolean Operate',
      message: i18n.lang.beambox.popup.more_than_two_object,
      type: alertConstants.SHOW_POPUP_ERROR,
    });

    return;
  }

  const batchCmd = new history.BatchCommand(`${mode} Elements`);
  const modeMap = { diff: 2, intersect: 0, union: 1, xor: 3 };
  const clipType = modeMap[mode];
  let d = '';
  let basePathText = '';

  if (elements[0].tagName === 'rect' && elements[0].getAttribute('rx')) {
    const cloned = elements[0].cloneNode(true) as SVGRectElement;
    const rx = elements[0].getAttribute('rx');

    if (rx) cloned.setAttribute('ry', rx);

    basePathText = cloned.outerHTML;
  } else {
    basePathText = elements[0].outerHTML;
  }

  for (let i = len - 1; i >= 1; i -= 1) {
    d = booleanOperationByPaperjs(basePathText, elements[i], clipType)!;
    basePathText = `<path d="${d}" />`;
  }

  const base = elements[0];
  const element = svgCanvas.addSvgElementFromJson({
    attr: {
      d,
      fill: base.getAttribute('fill'),
      'fill-opacity': base.getAttribute('fill-opacity'),
      id: svgCanvas.getNextId(),
      opacity: base.getAttribute('opacity'),
      stroke: '#000',
    },
    curStyles: false,
    element: 'path',
  }) as SVGPathElement;

  fixEnd(element);

  if (beamboxPreference.read('use_layer_color')) updateElementColor(element);

  batchCmd.addSubCommand(new history.InsertElementCommand(element));

  const cmd = deleteElements(elements, true);

  if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else if (addToHistory) undoManager.addCommandToHistory(batchCmd);

  svgCanvas.selectOnly([element], true);
};

export const doBooleanOperationOnSelected = (
  mode: BooleanOperationMode,
  opts?: { addToHistory?: boolean; parentCmd?: IBatchCommand },
): void => {
  const selectedElements = svgCanvas.getSelectedElems(true);

  doBooleanOperation(selectedElements, mode, opts);
};
