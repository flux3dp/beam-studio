import jsPDF from 'jspdf';
import { filter, map, pipe, prop } from 'remeda';

import Alert from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import dialogCaller from '@core/app/actions/dialog-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import type { ResponseWithError } from '@core/helpers/api/flux-id';
import { axiosFluxId, getCurrentUser, getDefaultHeader } from '@core/helpers/api/flux-id';
import beamFileHelper from '@core/helpers/beam-file-helper';
import i18n from '@core/helpers/i18n';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-maker';
import communicator from '@core/implementations/communicator';
import dialog from '@core/implementations/dialog';
import fs from '@core/implementations/fileSystem';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getData } from './layer/layer-config-helper';
import { getAllLayerNames, getLayerElementByName } from './layer/layer-helper';
import { layersToA4Base64 } from './layer/layersToA4Base64';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang;
const getDefaultFileName = () => (currentFileManager.getName() || 'untitled').replace('/', ':');

const switchSymbolWrapper = <T>(fn: () => T): T => {
  SymbolMaker.switchImageSymbolForAll(false);

  try {
    return fn();
  } finally {
    SymbolMaker.switchImageSymbolForAll(true);
  }
};

const generateBeamThumbnail = async (): Promise<ArrayBuffer | null> => {
  const { height, width } = workareaManager;
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const bbox = svgContent.getBBox();

  if (bbox.x < 0) {
    bbox.width += bbox.x;
    bbox.x = 0;
  }

  if (bbox.y < 0) {
    bbox.height += bbox.y;
    bbox.y = 0;
  }

  if (bbox.width <= 0 || bbox.height <= 0) {
    return null;
  }

  bbox.width = Math.min(bbox.width, width);
  bbox.height = Math.min(bbox.height, height);

  const [imageWidth, imageHeight] = pipe(
    // calculate down ratio
    300 / Math.max(bbox.width, bbox.height),
    // calculate image width and height
    (downRatio) => [Math.ceil(bbox.width * downRatio), Math.ceil(bbox.height * downRatio)],
  );
  const svgDefs = findDefs();
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  const useElements = clonedSvgContent.querySelectorAll('use');

  useElements.forEach((useElement) => SymbolMaker.switchImageSymbol(useElement, false));

  const svgString = `
    <svg
      width="${imageWidth}"
      height="${imageHeight}"
      viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${svgDefs.outerHTML}
      ${clonedSvgContent.innerHTML}
    </svg>`;
  const canvas = await svgStringToCanvas(svgString, imageWidth, imageHeight);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
  });

  return blob.arrayBuffer();
};

export const generateBeamBuffer = async (): Promise<Buffer> =>
  pipe(
    {
      imageSource: await svgCanvas.getImageSource(),
      svgString: svgCanvas.getSvgString(),
      thumbnail: await generateBeamThumbnail(),
    },
    ({ imageSource, svgString, thumbnail }) =>
      beamFileHelper.generateBeamBuffer(svgString, imageSource, thumbnail ?? undefined),
  );

const saveToCloud = async (uuid?: string): Promise<boolean> => {
  const id = 'upload-cloud-file';
  const user = getCurrentUser();

  if (!user) {
    dialogCaller.showLoginDialog();

    return false;
  }

  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();
  await Progress.openNonstopProgress({ id });

  try {
    const blob = pipe(
      await generateBeamBuffer(),
      (val) => Uint8Array.from(val),
      prop('buffer'),
      (arrayBuffer) => new Blob([arrayBuffer]),
    );
    const workarea = beamboxPreference.read('workarea');
    const form = new FormData();

    form.append('file', blob);
    form.append('workarea', workarea);

    let resp: ResponseWithError;

    if (uuid) {
      resp = await axiosFluxId.put(`/api/beam-studio/cloud/file/${uuid}`, form, {
        headers: getDefaultHeader(),
        withCredentials: true,
      });
    } else {
      const { fileName, isCancelled } = await dialogCaller.saveToCloud();

      if (isCancelled || !fileName) {
        return false;
      }

      currentFileManager.setFileName(fileName);
      form.append('type', 'file');
      resp = await axiosFluxId.post(`/api/beam-studio/cloud/add/${fileName}`, form, {
        headers: getDefaultHeader(),
        withCredentials: true,
      });
    }

    const { data, error, status: respStatus } = resp;

    if (error) {
      if (!error.response) {
        Alert.popUpError({ message: LANG.flux_id_login.connection_fail });

        return false;
      }

      const { status, statusText } = error.response;
      const { detail, info, message } = error.response.data || {};

      if (status === 403 && detail && detail.startsWith('CSRF Failed: CSRF')) {
        Alert.popUp({
          buttonType: AlertConstants.CONFIRM_CANCEL,
          message: i18n.lang.beambox.popup.ai_credit.relogin_to_use,
          onConfirm: dialogCaller.showLoginDialog,
        });

        return false;
      }

      if (info === 'STORAGE_LIMIT_EXCEEDED') {
        Alert.popUpError({ message: LANG.my_cloud.save_file.storage_limit_exceeded });

        return false;
      }

      Alert.popUpError({ caption: info, message: detail || message || `${status}: ${statusText}` });

      return false;
    }

    const { info, new_file: newUuid, status } = data;

    if (status === 'ok') {
      if (newUuid) {
        currentFileManager.setCloudUUID(newUuid);
      }

      currentFileManager.setHasUnsavedChanges(false, false);

      return true;
    }

    Alert.popUpError({ message: `Server Error: ${respStatus} ${info}` });

    return false;
  } catch (e) {
    console.error(e);
    Alert.popUpError({ message: `Error: ${LANG.topbar.menu.save_to_cloud}` });

    return false;
  } finally {
    Progress.popById(id);
  }
};

const saveAsFile = async (): Promise<boolean> => {
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const defaultFileName = getDefaultFileName();
  const langFile = LANG.topmenu.file;
  const getContent = async () =>
    pipe(
      await generateBeamBuffer(),
      (buffer) => Uint8Array.from(buffer),
      prop('buffer'),
      (arrayBuffer) => new Blob([arrayBuffer]),
    );

  const newFilePath = await dialog.writeFileDialog(
    getContent,
    langFile.save_scene,
    window.os === 'Linux' ? `${defaultFileName}.beam` : defaultFileName,
    [
      { extensions: ['beam'], name: window.os === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files },
      { extensions: ['*'], name: i18n.lang.topmenu.file.all_files },
    ],
  );

  if (newFilePath) {
    currentFileManager.setLocalFile(newFilePath);
    svgCanvas.updateRecentFiles(newFilePath);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  if (isWeb()) {
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};

const saveFile = async (): Promise<boolean> => {
  const path = currentFileManager.getPath();

  if (!path) {
    return saveAsFile();
  }

  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const output = svgCanvas.getSvgString();

  if (currentFileManager.isCloudFile) {
    return saveToCloud(path);
  }

  if (path.endsWith('.bvg')) {
    fs.writeFile(path, output);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  if (path.endsWith('.beam')) {
    const buffer = await generateBeamBuffer();

    fs.writeStream(path, 'w', [buffer]);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};

const checkNounProjectElements = () => {
  const svgContent = document.getElementById('svgcontent')!;
  const npElements = svgContent.querySelectorAll('[data-np="1"]');

  if (npElements.length === 0) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      caption: LANG.noun_project_panel.export_svg_title,
      id: 'export-noun-project-svg',
      message: LANG.noun_project_panel.export_svg_warning,
      onNo: () => resolve(false),
      onYes: () => resolve(true),
    });
  });
};

const removeNPElementsWrapper = <T>(fn: () => T) => {
  const svgContent = document.getElementById('svgcontent')!;
  const npElements = svgContent.querySelectorAll('[data-np="1"]');
  const removedElements = Array.of<{ elem: Element; nextSibling: Element; parentNode: Element }>();

  for (const elem of npElements) {
    const parentNode = elem.parentNode as Element;

    if (parentNode && parentNode.getAttribute('data-np') === '1') {
      const nextSibling = elem.nextSibling as Element;

      removedElements.push({ elem, nextSibling, parentNode });
      elem.remove();
    }
  }

  const res = fn();

  for (let i = removedElements.length - 1; i >= 0; i--) {
    const { elem, nextSibling, parentNode } = removedElements[i];

    try {
      parentNode.insertBefore(elem, nextSibling);
    } catch {
      parentNode.appendChild(elem);
    }
  }

  return res;
};

const exportAsBVG = async (): Promise<boolean> => {
  if (!(await checkNounProjectElements())) {
    return false;
  }

  svgCanvas.clearSelection();

  const defaultFileName = getDefaultFileName();
  const langFile = LANG.topmenu.file;

  svgCanvas.removeUnusedDefs();

  const getContent = () => removeNPElementsWrapper(() => switchSymbolWrapper(() => svgCanvas.getSvgString()));
  const newFilePath = await dialog.writeFileDialog(getContent, langFile.save_scene, defaultFileName, [
    { extensions: ['bvg'], name: window.os === 'MacOS' ? `${langFile.scene_files} (*.bvg)` : langFile.scene_files },
    { extensions: ['*'], name: langFile.all_files },
  ]);

  if (newFilePath) {
    currentFileManager.setLocalFile(newFilePath);
    svgCanvas.updateRecentFiles(newFilePath);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};

const exportAsSVG = async (): Promise<void> => {
  if (!(await checkNounProjectElements())) {
    return;
  }

  svgCanvas.clearSelection();

  const getContent = () => {
    const allLayers = document.querySelectorAll('g.layer');

    allLayers.forEach((layer) => layer.removeAttribute('clip-path'));
    svgCanvas.removeUnusedDefs();

    const res = removeNPElementsWrapper(() => switchSymbolWrapper(() => svgCanvas.getSvgString({ unit: 'mm' })));

    allLayers.forEach((layer) => layer.setAttribute('clip-path', 'url(#scene_mask)'));

    return res;
  };
  const defaultFileName = getDefaultFileName();
  const langFile = LANG.topmenu.file;

  await dialog.writeFileDialog(getContent, langFile.save_svg, defaultFileName, [
    { extensions: ['svg'], name: window.os === 'MacOS' ? `${langFile.svg_files} (*.svg)` : langFile.svg_files },
    { extensions: ['*'], name: langFile.all_files },
  ]);
};

const exportAsImage = async (type: 'jpg' | 'png'): Promise<void> => {
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const output = switchSymbolWrapper(() => svgCanvas.getSvgString());
  const langFile = LANG.topmenu.file;

  Progress.openNonstopProgress({ id: 'export_image', message: langFile.converting });

  const defaultFileName = getDefaultFileName();
  const { height, width } = workareaManager;
  const canvas = await svgStringToCanvas(output, width, height);
  let base64 = '';

  if (type === 'png') {
    base64 = canvas.toDataURL('image/png');
  } else if (type === 'jpg') {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    base64 = canvas.toDataURL('image/jpeg', 1.0);
  }

  base64 = base64.replace(/^data:image\/\w+;base64,/, '');

  const getContent = () => new Blob([Buffer.from(base64, 'base64')]);
  const fileTypeName = `${langFile[`${type}_files`]}`;

  Progress.popById('export_image');
  await dialog.writeFileDialog(getContent, langFile[`save_${type}`], defaultFileName, [
    { extensions: [type], name: window.os === 'MacOS' ? `${fileTypeName} (*.${type})` : fileTypeName },
    { extensions: ['*'], name: langFile.all_files },
  ]);
};

const toggleUnsavedChangedDialog = async (): Promise<boolean> =>
  new Promise((resolve) => {
    communicator.send('SAVE_DIALOG_POPPED');

    if (!currentFileManager.getHasUnsavedChanges() || window.location.hash !== '#/studio/beambox') {
      resolve(true);
    } else {
      Alert.popById('unsaved_change_dialog');
      Alert.popUp({
        buttonLabels: [LANG.alert.save, LANG.alert.dont_save, LANG.alert.cancel],
        callbacks: [
          async () => {
            if (await saveFile()) resolve(true);
          },
          () => resolve(true),
          () => resolve(false),
        ],
        id: 'unsaved_change_dialog',
        message: LANG.beambox.popup.save_unsave_changed,
        primaryButtonIndex: 0,
      });
    }
  });

export const exportUvPrintAsPdf = async (): Promise<void> => {
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const layers = pipe(
    getAllLayerNames(),
    filter((layerName) => getData(getLayerElementByName(layerName), 'module') === LayerModule.UV_PRINT),
    map(getLayerElementByName),
  ) as SVGGElement[];
  const base64 = await switchSymbolWrapper(() => layersToA4Base64(layers));
  const defaultFileName = getDefaultFileName();

  new jsPDF().addImage(base64, 'PNG', 0, 0, 210, 297).save(defaultFileName);
};

export default {
  exportAsBVG,
  exportAsImage,
  exportAsSVG,
  exportUvPrintAsPdf,
  saveAsFile,
  saveFile,
  saveToCloud,
  toggleUnsavedChangedDialog,
};
