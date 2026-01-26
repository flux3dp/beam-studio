import alertCaller from '@core/app/actions/alert-caller';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { fullColorHeadModules, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { EngraveDpiOption, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeMultipleDocumentStoreValues, useDocumentStore } from '@core/app/stores/documentStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import history from '@core/app/svgedit/history/history';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import { loadContextGoogleFonts } from '@core/helpers/fonts/googleFontService';
import i18n from '@core/helpers/i18n';
import { applyDefaultLaserModule, toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import { changeLayersModule } from '@core/helpers/layer-module/change-module';
import {
  getDefaultLaserModule,
  getLayersByModule,
  hasModuleLayer,
} from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { DocumentState } from '@core/interfaces/Preference';

import setSvgContent from './setSvgContent';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

export const importBvgString = async (
  str: string,
  opts: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
): Promise<void> => {
  const batchCmd = new history.BatchCommand('Import Bvg');

  svgCanvas.clearSelection();

  const setContentCmd = setSvgContent(str.replace(/STYLE>/g, 'style>').replace(/<STYLE/g, '<style'));

  if (!setContentCmd) {
    alertCaller.popUp({
      id: 'load SVG fail',
      message: i18n.lang.beambox.popup.failed_to_load_svg,
      type: alertConstants.SHOW_POPUP_WARNING,
    });

    return;
  }

  if (!setContentCmd.isEmpty()) batchCmd.addSubCommand(setContentCmd);

  const currentWorkarea: WorkAreaModel = workareaManager.model;

  // loadFromString will lose data-xform and data-wireframe of `use` so set it back here
  if (typeof str === 'string') {
    const tmp = str.substring(str.indexOf('<use')).split('<use');

    for (let i = 1; i < tmp.length; i++) {
      tmp[i] = tmp[i].substring(0, tmp[i].indexOf('/>'));

      const id = tmp[i].match(/id="(svg_\d+)"/)?.[1];
      const elem = document.getElementById(id!);

      if (elem) {
        const xform = tmp[i].match(/data-xform="([^"]*)"/)?.[1];

        if (xform) elem.setAttribute('data-xform', xform);

        const wireframe = tmp[i].match(/data-wireframe="([a-z]*)"/)?.[1];

        if (wireframe) elem?.setAttribute('data-wireframe', String(wireframe === 'true'));
      }
    }

    let matched = str.match(/data-rotary_mode="([^"]*)"/);
    const addOnInfo = getAddOnInfo(currentWorkarea as WorkAreaModel);
    const newDocumentState: Partial<DocumentState> = {};

    if (matched) {
      let rotaryMode: string = matched[1];

      if (['0', '1'].includes(rotaryMode)) {
        rotaryMode = rotaryMode === '1' ? 'true' : 'false';
      }

      if (addOnInfo.rotary) {
        newDocumentState['rotary_mode'] = rotaryMode === 'true';

        if (rotaryMode === 'true') {
          newDocumentState['auto-feeder'] = false;
          newDocumentState['pass-through'] = false;
          curveEngravingModeController.clearArea(false);
        }
      } else {
        newDocumentState['rotary_mode'] = false;
      }
    }

    const engraveDpi = str.match(/data-engrave_dpi="([a-zA-Z]+)"/)?.[1];

    if (engraveDpi) {
      newDocumentState['engrave_dpi'] = engraveDpi as EngraveDpiOption;
    } else {
      newDocumentState['engrave_dpi'] = 'medium';
    }

    if (addOnInfo.hybridLaser) {
      matched = str.match(/data-en_diode="([a-zA-Z]+)"/);

      if (matched && matched[1]) {
        if (matched[1] === 'true') {
          newDocumentState['enable-diode'] = true;
        } else {
          newDocumentState['enable-diode'] = false;
        }
      }
    }

    if (addOnInfo.autoFocus) {
      matched = str.match(/data-en_af="([a-zA-Z]+)"/);

      if (matched && matched[1]) {
        if (matched[1] === 'true') {
          newDocumentState['enable-autofocus'] = true;
        } else {
          newDocumentState['enable-autofocus'] = false;
        }
      }
    }

    if (addOnInfo.passThrough) {
      matched = str.match(/data-pass_through="([0-9.]+)"/);

      if (matched && matched[1]) {
        const height = Number.parseFloat(matched[1]);

        if (!Number.isNaN(height) && height > 0) {
          newDocumentState['pass-through'] = true;
          newDocumentState['pass-through-height'] = height;
          newDocumentState['auto-feeder'] = false;
          newDocumentState['rotary_mode'] = false;
          curveEngravingModeController.clearArea(false);
        }
      }
    }

    if (addOnInfo.autoFeeder) {
      matched = str.match(/data-auto-feeder-height="([0-9.]+)"/);

      if (matched && matched[1]) {
        const height = Number.parseFloat(matched[1]);

        if (!Number.isNaN(height) && height > 0) {
          newDocumentState['auto-feeder'] = true;
          newDocumentState['auto-feeder-height'] = height;
          newDocumentState['pass-through'] = false;
          newDocumentState['rotary_mode'] = false;
          curveEngravingModeController.clearArea(false);
        }
      }
    }

    const cmd = changeMultipleDocumentStoreValues(newDocumentState, { parentCmd: batchCmd });

    rotaryAxis.toggleDisplay();

    cmd.onAfter = () => {
      rotaryAxis.toggleDisplay();
    };

    useLayerStore.getState().forceUpdate();
  }

  const { lang } = i18n;
  let newWorkarea = currentWorkarea;
  const hasPrintingLayer = hasModuleLayer([LayerModule.PRINTER]);
  const shouldChangeToAdor = currentWorkarea !== 'ado1' && hasPrintingLayer;
  const has4CLayer = hasModuleLayer(fullColorHeadModules);
  const shouldChangeToBeamo2 = currentWorkarea !== 'fbm2' && has4CLayer;

  if (shouldChangeToAdor || shouldChangeToBeamo2) {
    const message = shouldChangeToBeamo2
      ? lang.layer_module.notification.importedDocumentContainsPrinting4C
      : lang.layer_module.notification.importedDocumentContainsPrinting;
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        id: 'ask-change-workarea',
        message,
        onNo: () => resolve(false),
        onYes: () => resolve(true),
      });
    });

    if (res) {
      newWorkarea = shouldChangeToAdor ? 'ado1' : 'fbm2';
    } else {
      alertCaller.popUp({
        message: lang.layer_module.notification.printingLayersConverted,
        type: alertConstants.SHOW_POPUP_INFO,
      });
    }
  } else {
    applyDefaultLaserModule();
  }

  if (getAddOnInfo(newWorkarea).multiModules) {
    if (has4CLayer) {
      useDocumentStore.getState().set('enable-4c', true);
      useDocumentStore.getState().set('enable-1064', false);

      const layers = getLayersByModule([LayerModule.LASER_1064]);

      if (layers.length > 0) {
        await changeLayersModule(Array.from(layers), LayerModule.LASER_1064, getDefaultLaserModule(newWorkarea));
      }
    } else if (hasModuleLayer([LayerModule.LASER_1064])) {
      useDocumentStore.getState().set('enable-4c', false);
      useDocumentStore.getState().set('enable-1064', true);
    }
  }

  console.log('Change workarea to', newWorkarea);

  const changeWorkareaCmd = changeWorkarea(newWorkarea, { toggleModule: false });

  batchCmd.addSubCommand(changeWorkareaCmd);

  const defs = findDefs();
  const { nextSibling, parentNode } = defs;

  defs.remove();
  batchCmd.addSubCommand(new history.RemoveElementCommand(defs, nextSibling!, parentNode!));
  svgedit.utilities.moveDefsOutfromSvgContent();

  const newDefs = findDefs();

  batchCmd.addSubCommand(new history.InsertElementCommand(newDefs));

  const { addToHistory = true, parentCmd } = opts;
  const postImportBvgString: any = async () => {
    const { workarea } = useDocumentStore.getState();

    // toggle full color setting according workarea supported modules
    toggleFullColorAfterWorkareaChange();
    presprayArea.togglePresprayArea();
    useLayerStore.getState().setSelectedLayers([]);

    if (!parentCmd) {
      workareaManager.setWorkarea(workarea);
      workareaManager.resetView();
    }

    await symbolMaker.reRenderAllImageSymbols();
  };

  await postImportBvgString();
  batchCmd.onAfter = postImportBvgString;
  loadContextGoogleFonts();

  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else if (addToHistory) svgCanvas.addCommandToHistory(batchCmd);
};

const importBvg = async (file: Blob): Promise<void> => {
  await new Promise<void>((resolve) => {
    const reader = new FileReader();

    reader.onloadend = async (evt) => {
      const str = evt.target?.result;

      await importBvgString(str as string);
      resolve();
    };
    reader.readAsText(file);
  });
  currentFileManager.setHasUnsavedChanges(false);
};

export default importBvg;
