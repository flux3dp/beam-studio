import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithPrinter4C } from '@core/app/actions/beambox/constant';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { fullColorHeadModules, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeMultipleDocumentStoreValues, useDocumentStore } from '@core/app/stores/documentStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useStlStore } from '@core/app/stores/stlStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import history from '@core/app/svgedit/history/history';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import { resolveInnerEngravingForFile } from '@core/app/svgedit/operations/import/innerEngravingGate';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import { loadContextGoogleFonts } from '@core/helpers/fonts/googleFontService';
import i18n from '@core/helpers/i18n';
import { toggleModuleAfterWorkareaChange, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { changeLayersModule } from '@core/helpers/layer-module/change-module';
import { getDefaultModule, getLayersByModule, hasModuleLayer } from '@core/helpers/layer-module/layer-module-helper';
import { regulateEngraveDpiOption } from '@core/helpers/regulateEngraveDpi';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';
import type { DocumentState } from '@core/interfaces/Preference';

import { handleHistoryActionOptions } from '../../history/utils/handleHistoryActionOptions';
import layerManager from '../../layer/layerManager';
import selectionManager from '../../selection';

import setSvgContent from './setSvgContent';

let svgedit: any;

getSVGAsync((globalSVG) => {
  svgedit = globalSVG.Edit;
});

export const importBvgString = async (str: string, opts: HistoryActionOptions = {}): Promise<void> => {
  const batchCmd = new history.BatchCommand('Import Bvg');

  selectionManager.clearSelection();

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

  // svgcontent has just been replaced, so every projection rect of the previous document is gone.
  // The meshes are not in the DOM and would otherwise sit in the store holding GPU buffers.
  // ⚠️ Known limit: undoing a file load restores the previous rects but not their meshes.
  useStlStore.getState().clear();

  const currentWorkarea: WorkAreaModel = workareaManager.model;
  // set while reading the document state below, and consumed by the work area decision further down
  let innerEngravingWorkarea: null | WorkAreaModel = null;

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

    // inner engraving mode, gated by the model: a file made on Promark UV opened elsewhere must not
    // switch the app into a mode the machine cannot do. When the machine *is* available the user is
    // asked, because saying yes changes the document's work area — see `innerEngravingGate`
    const innerEngraving = str.match(/data-inner-engraving="([a-z]+)"/)?.[1] === 'true';
    const innerEngravingResult = await resolveInnerEngravingForFile(innerEngraving, currentWorkarea);

    innerEngravingWorkarea = innerEngravingResult.workarea;
    newDocumentState['inner-engraving'] = innerEngravingResult.innerEngraving;

    const engraveDpi = str.match(/data-engrave_dpi="([a-zA-Z]+)"/)?.[1];

    if (engraveDpi) {
      // Backward compatibility for global preference 'engrave_dpi'
      const regulatedDpi = regulateEngraveDpiOption(currentWorkarea, engraveDpi as EngraveDpiOption);

      layerManager.getAllLayers().forEach((layer) => {
        writeDataLayer(layer.getGroup(), 'dpi', regulatedDpi);
      });
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
  // an inner engraving document holds no 2D artwork at all, so it can never be one of the printing
  // cases below — the two branches cannot both want a work area
  let newWorkarea = innerEngravingWorkarea ?? currentWorkarea;
  const hasPrintingLayer = hasModuleLayer([LayerModule.PRINTER]);
  const shouldChangeToAdor = currentWorkarea !== 'ado1' && hasPrintingLayer;
  const has4CLayer = hasModuleLayer(fullColorHeadModules);
  const shouldChangeToBeamo2 = !modelsWithPrinter4C.includes(currentWorkarea) && has4CLayer;

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
  }

  if (getAddOnInfo(newWorkarea).multiModules) {
    if (has4CLayer) {
      useDocumentStore.getState().set('enable-4c', true);
      useDocumentStore.getState().set('enable-1064', false);

      const layers = getLayersByModule([LayerModule.LASER_1064]);

      if (layers.length > 0) {
        await changeLayersModule(Array.from(layers), LayerModule.LASER_1064, getDefaultModule(newWorkarea));
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

  const { parentCmd } = opts;
  const postImportBvgString: any = async () => {
    const { workarea } = useDocumentStore.getState();

    // Change modules not supported to default module of the new workarea
    toggleModuleAfterWorkareaChange();
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

  handleHistoryActionOptions(batchCmd, opts);
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
