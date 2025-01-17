import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import changeWorkarea from 'app/svgedit/operations/changeWorkarea';
import currentFileManager from 'app/svgedit/currentFileManager';
import findDefs from 'app/svgedit/utils/findDef';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import i18n from 'helpers/i18n';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import presprayArea from 'app/actions/canvas/prespray-area';
import rotaryAxis from 'app/actions/canvas/rotary-axis';
import symbolMaker from 'helpers/symbol-maker';
import workareaManager from 'app/svgedit/workarea';
import {
  applyDefaultLaserModule,
  toggleFullColorAfterWorkareaChange,
} from 'helpers/layer/layer-config-helper';
import { changeBeamboxPreferenceValue } from 'app/svgedit/history/beamboxPreferenceCommand';
import { getSupportInfo } from 'app/constants/add-on';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand, ICommand } from 'interfaces/IHistory';
import { WorkAreaModel } from 'app/constants/workarea-constants';

import setSvgContent from './setSvgContent';

let svgCanvas: ISVGCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

export const importBvgString = async (
  str: string,
  opts: { parentCmd?: IBatchCommand; addToHistory?: boolean } = {}
): Promise<void> => {
  const batchCmd = new history.BatchCommand('Import Bvg');
  svgCanvas.clearSelection();
  const setContentCmd = setSvgContent(
    str.replace(/STYLE>/g, 'style>').replace(/<STYLE/g, '<style')
  );
  if (!setContentCmd) {
    alertCaller.popUp({
      id: 'load SVG fail',
      type: alertConstants.SHOW_POPUP_WARNING,
      message: 'Error: Unable to load SVG data',
    });
    return;
  }
  if (!setContentCmd.isEmpty()) batchCmd.addSubCommand(setContentCmd);

  const currentWorkarea: WorkAreaModel = beamboxPreference.read('workarea');
  // loadFromString will lose data-xform and data-wireframe of `use` so set it back here
  if (typeof str === 'string') {
    const workarea = document.getElementById('workarea');
    const tmp = str.substr(str.indexOf('<use')).split('<use');

    for (let i = 1; i < tmp.length; i += 1) {
      tmp[i] = tmp[i].substring(0, tmp[i].indexOf('/>'));
      const id = tmp[i].match(/id="(svg_\d+)"/)?.[1];
      const elem = document.getElementById(id);
      if (elem) {
        const xform = tmp[i].match(/data-xform="([^"]*)"/)?.[1];
        if (xform) elem.setAttribute('data-xform', xform);
        const wireframe = tmp[i].match(/data-wireframe="([a-z]*)"/)?.[1];
        if (wireframe) elem?.setAttribute('data-wireframe', String(wireframe === 'true'));
      }
    }
    let match = str.match(/data-rotary_mode="([^"]*)"/);
    const supportInfo = getSupportInfo(currentWorkarea as WorkAreaModel);
    if (match) {
      let rotaryMode = match[1];

      if (rotaryMode === 'true') rotaryMode = '1';
      let cmd: ICommand;
      if (supportInfo.rotary) {
        cmd = changeBeamboxPreferenceValue('rotary_mode', parseInt(rotaryMode, 10), {
          parentCmd: batchCmd,
        });
      } else {
        cmd = changeBeamboxPreferenceValue('rotary_mode', 0, { parentCmd: batchCmd });
        beamboxPreference.write('rotary_mode', 0);
      }
      cmd.onAfter = () => {
        rotaryAxis.toggleDisplay();
        workareaManager.setWorkarea(beamboxPreference.read('workarea'));
      };
      rotaryAxis.toggleDisplay();
    }
    const engraveDpi = str.match(/data-engrave_dpi="([a-zA-Z]+)"/)?.[1];
    if (engraveDpi) {
      changeBeamboxPreferenceValue('engrave_dpi', engraveDpi, { parentCmd: batchCmd });
    } else {
      changeBeamboxPreferenceValue('engrave_dpi', 'medium', { parentCmd: batchCmd });
    }
    if (supportInfo.hybridLaser) {
      match = str.match(/data-en_diode="([a-zA-Z]+)"/);
      if (match && match[1]) {
        if (match[1] === 'true') {
          changeBeamboxPreferenceValue('enable-diode', true, { parentCmd: batchCmd });
        } else {
          changeBeamboxPreferenceValue('enable-diode', false, { parentCmd: batchCmd });
        }
      }
    }
    if (supportInfo.autoFocus) {
      match = str.match(/data-en_af="([a-zA-Z]+)"/);
      if (match && match[1]) {
        if (match[1] === 'true') {
          changeBeamboxPreferenceValue('enable-autofocus', true, { parentCmd: batchCmd });
        } else {
          changeBeamboxPreferenceValue('enable-autofocus', false, { parentCmd: batchCmd });
        }
      }
    }
    if (supportInfo.passThrough) {
      match = str.match(/data-pass_through="([0-9.]+)"/);
      if (match && match[1]) {
        const height = parseFloat(match[1]);
        if (!Number.isNaN(height) && height > 0) {
          changeBeamboxPreferenceValue('pass-through', true, { parentCmd: batchCmd });
          changeBeamboxPreferenceValue('pass-through-height', height, { parentCmd: batchCmd });
        }
      }
    }
    LayerPanelController.updateLayerPanel();
    match = str.match(/data-zoom="[0-9.]+"/);
    if (match) {
      const zoom = parseFloat(match[0].substring(11, match[0].length - 1));
      workareaManager.zoom(zoom);
    }
    match = str.match(/data-left="[-0-9]+"/);
    const { width, height, zoomRatio } = workareaManager;
    if (match) {
      let left = parseInt(match[0].substring(11, match[0].length - 1), 10);
      left = Math.round((left + width) * zoomRatio);
      workarea.scrollLeft = left;
    }
    match = str.match(/data-top="[-0-9]+"/);
    if (match) {
      let top = parseInt(match[0].substring(10, match[0].length - 1), 10);
      top = Math.round((top + height) * zoomRatio);
      workarea.scrollTop = top;
    }
  }
  const { lang } = i18n;
  let newWorkarea = currentWorkarea;
  if (!modelsWithModules.has(currentWorkarea)) {
    const hasPrintingLayer =
      document
        .getElementById('svgcontent')
        ?.querySelectorAll(`g.layer[data-module="${LayerModule.PRINTER}"]`).length > 0;
    if (hasPrintingLayer) {
      const res = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          id: 'ask-change-workarea',
          message: lang.layer_module.notification.importedDocumentContainsPrinting,
          buttonType: alertConstants.YES_NO,
          onYes: () => resolve(true),
          onNo: () => resolve(false),
        });
      });
      if (res) {
        newWorkarea = 'ado1';
      } else {
        alertCaller.popUp({
          type: alertConstants.SHOW_POPUP_INFO,
          message: lang.layer_module.notification.printingLayersCoverted,
        });
      }
    }
  } else {
    applyDefaultLaserModule();
  }
  console.log('Change workarea to', newWorkarea);
  const changeWorkareaCmd = changeWorkarea(newWorkarea, { toggleModule: false });
  batchCmd.addSubCommand(changeWorkareaCmd);
  const defs = findDefs();
  const { parentNode, nextSibling } = defs;
  defs.remove();
  batchCmd.addSubCommand(new history.RemoveElementCommand(defs, nextSibling, parentNode));
  svgedit.utilities.moveDefsOutfromSvgContent();
  const newDefs = findDefs();
  batchCmd.addSubCommand(new history.InsertElementCommand(newDefs));
  const postImportBvgString = async () => {
    const workarea = beamboxPreference.read('workarea');
    if (!modelsWithModules.has(workarea)) {
      toggleFullColorAfterWorkareaChange();
    }
    await symbolMaker.reRenderAllImageSymbol();
    presprayArea.togglePresprayArea();
    LayerPanelController.setSelectedLayers([]);
  };
  await postImportBvgString();
  batchCmd.onAfter = postImportBvgString;
  const { parentCmd, addToHistory = true } = opts;
  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else if (addToHistory) svgCanvas.addCommandToHistory(batchCmd);
};

const importBvg = async (file: Blob): Promise<void> => {
  await new Promise<void>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async (evt) => {
      const str = evt.target.result;
      await importBvgString(str as string);
      resolve();
    };
    reader.readAsText(file);
  });
  currentFileManager.setHasUnsavedChanges(false);
};

export default importBvg;
