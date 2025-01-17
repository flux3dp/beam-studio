/* eslint-disable no-console */
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import beamFileHelper from 'helpers/beam-file-helper';
import communicator from 'implementations/communicator';
import currentFileManager from 'app/svgedit/currentFileManager';
import dialog from 'implementations/dialog';
import dialogCaller from 'app/actions/dialog-caller';
import findDefs from 'app/svgedit/utils/findDef';
import fs from 'implementations/fileSystem';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import Progress from 'app/actions/progress-caller';
import SymbolMaker from 'helpers/symbol-maker';
import svgStringToCanvas from 'helpers/image/svgStringToCanvas';
import workareaManager from 'app/svgedit/workarea';
import {
  axiosFluxId,
  getCurrentUser,
  getDefaultHeader,
  ResponseWithError,
} from 'helpers/api/flux-id';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang;

const switchSymbolWrapper = <T = string>(fn: () => T) => {
  SymbolMaker.switchImageSymbolForAll(false);
  const res = fn();
  SymbolMaker.switchImageSymbolForAll(true);
  return res;
};

const generateBeamThumbnail = async (): Promise<ArrayBuffer | null> => {
  const { width, height } = workareaManager;
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
  if (bbox.width <= 0 || bbox.height <= 0) return null
  bbox.width = Math.min(bbox.width, width);
  bbox.height = Math.min(bbox.height, height);
  const downRatio = 300 / Math.max(bbox.width, bbox.height);
  const imageWidth = Math.ceil(bbox.width * downRatio);
  const imageHeight = Math.ceil(bbox.height * downRatio);
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
    canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
  });
  const arrayBuffer = await blob.arrayBuffer();
  return arrayBuffer;
};

export const generateBeamBuffer = async (): Promise<Buffer> => {
  const svgCanvasString = svgCanvas.getSvgString();
  const imageSource = await svgCanvas.getImageSource();
  const thumbnail = await generateBeamThumbnail();
  const buffer = beamFileHelper.generateBeamBuffer(svgCanvasString, imageSource, thumbnail);
  return buffer;
};

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
    const buffer = await generateBeamBuffer();
    const arrayBuffer = Uint8Array.from(buffer).buffer;
    const blob = new Blob([arrayBuffer]);
    const workarea = beamboxPreference.read('workarea');
    const form = new FormData();
    form.append('file', blob);
    form.append('workarea', workarea);
    let resp: ResponseWithError;
    if (uuid) {
      resp = await axiosFluxId.put(`/api/beam-studio/cloud/file/${uuid}`, form, {
        withCredentials: true,
        headers: getDefaultHeader(),
      });
    } else {
      const { fileName, isCancelled } = await dialogCaller.saveToCloud();
      if (isCancelled || !fileName) return false;
      currentFileManager.setFileName(fileName);
      form.append('type', 'file');
      resp = await axiosFluxId.post(`/api/beam-studio/cloud/add/${fileName}`, form, {
        withCredentials: true,
        headers: getDefaultHeader(),
      });
    }
    const { data, status: respStatus, error } = resp;
    if (error) {
      if (!error.response) {
        Alert.popUpError({ message: LANG.flux_id_login.connection_fail });
        return false;
      }
      const { status, statusText } = error.response;
      const { info, message, detail } = error.response.data || {};
      if (status === 403 && detail && detail.startsWith('CSRF Failed: CSRF')) {
        Alert.popUp({
          message: i18n.lang.beambox.popup.ai_credit.relogin_to_use,
          buttonType: AlertConstants.CONFIRM_CANCEL,
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
    const { status, info, new_file: newUuid } = data;
    if (status === 'ok') {
      if (newUuid) currentFileManager.setCloudUUID(newUuid);
      currentFileManager.setHasUnsavedChanges(false, false);
      return true;
    }
    Alert.popUpError({
      message: `Server Error: ${respStatus} ${info}`,
    });
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
  const defaultFileName = (currentFileManager.getName() || 'untitled').replace('/', ':');
  const langFile = LANG.topmenu.file;
  const getContent =  async () => {
    const buffer = await generateBeamBuffer();
    const arrayBuffer = Uint8Array.from(buffer).buffer;
    const blob = new Blob([arrayBuffer]);
    return blob;
  };
  const newFilePath = await dialog.writeFileDialog(
    getContent,
    langFile.save_scene,
    window.os === 'Linux' ? `${defaultFileName}.beam` : defaultFileName,
    [
      {
        name: window.os === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files,
        extensions: ['beam'],
      },
      {
        name: i18n.lang.topmenu.file.all_files,
        extensions: ['*'],
      },
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
    const result = await saveAsFile();
    return result;
  }
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();
  const output = svgCanvas.getSvgString();
  if (currentFileManager.isCloudFile) {
    const result = await saveToCloud(path);
    return result;
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
  const svgContent = document.getElementById('svgcontent');
  const npElements = svgContent.querySelectorAll('[data-np="1"]');
  if (npElements.length === 0) {
    return true;
  }
  return new Promise<boolean>((resolve) => {
    Alert.popUp({
      id: 'export-noun-project-svg',
      buttonType: AlertConstants.YES_NO,
      caption: LANG.noun_project_panel.export_svg_title,
      message: LANG.noun_project_panel.export_svg_warning,
      onYes: () => resolve(true),
      onNo: () => resolve(false),
    });
  });
};

const removeNPElementsWrapper = <T = string>(fn: () => T) => {
  const svgContent = document.getElementById('svgcontent');
  const npElements = svgContent.querySelectorAll('[data-np="1"]');
  const removedElements = [] as { elem: Element, parentNode: Element, nextSibling: Element }[];
  for (let i = 0; i < npElements.length; i += 1) {
    const elem = npElements[i];
    const parentNode = elem.parentNode as Element;
    if (parentNode && parentNode.getAttribute('data-np') === '1') {
      const nextSibling = elem.nextSibling as Element;
      removedElements.push({ elem, parentNode, nextSibling });
      elem.remove();
    }
  }
  const res = fn();
  for (let i = removedElements.length - 1; i >= 0; i -= 1) {
    const { elem, parentNode, nextSibling } = removedElements[i];
    try {
      parentNode.insertBefore(elem, nextSibling);
    } catch (error) {
      parentNode.appendChild(elem);
    }
  }
  return res;
};

const exportAsBVG = async (): Promise<boolean> => {
  if (!await checkNounProjectElements()) {
    return false;
  }
  svgCanvas.clearSelection();
  const defaultFileName = (currentFileManager.getName() || 'untitled').replace('/', ':');
  const langFile = LANG.topmenu.file;
  svgCanvas.removeUnusedDefs();
  const getContent = () => removeNPElementsWrapper(
    () => switchSymbolWrapper<string>(
      () => svgCanvas.getSvgString(),
    ),
  );
  const newFilePath = await dialog.writeFileDialog(
    getContent,
    langFile.save_scene,
    defaultFileName,
    [
      { name: window.os === 'MacOS' ? `${langFile.scene_files} (*.bvg)` : langFile.scene_files, extensions: ['bvg'] },
      { name: langFile.all_files, extensions: ['*'] },
    ],
  );
  if (newFilePath) {
    currentFileManager.setLocalFile(newFilePath);
    svgCanvas.updateRecentFiles(newFilePath);
    currentFileManager.setHasUnsavedChanges(false, false);
    return true;
  }
  return false;
};

const exportAsSVG = async (): Promise<void> => {
  if (!await checkNounProjectElements()) {
    return;
  }
  svgCanvas.clearSelection();
  const getContent = () => {
    document.querySelectorAll('g.layer').forEach((layer) => layer.removeAttribute('clip-path'));
    svgCanvas.removeUnusedDefs();
    const res = removeNPElementsWrapper(
      () => switchSymbolWrapper<string>(
        () => svgCanvas.getSvgString({ unit: 'mm' }),
      ),
    );
    document.querySelectorAll('g.layer').forEach((layer) => layer.setAttribute('clip-path', 'url(#scene_mask)'));
    return res;
  };
  const defaultFileName = (currentFileManager.getName() || 'untitled').replace('/', ':');
  const langFile = LANG.topmenu.file;

  await dialog.writeFileDialog(getContent, langFile.save_svg, defaultFileName, [
    { name: window.os === 'MacOS' ? `${langFile.svg_files} (*.svg)` : langFile.svg_files, extensions: ['svg'] },
    { name: langFile.all_files, extensions: ['*'] },
  ]);
};

const exportAsImage = async (type: 'png' | 'jpg'): Promise<void> => {
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();
  const output = switchSymbolWrapper<string>(() => svgCanvas.getSvgString());
  const langFile = LANG.topmenu.file;
  Progress.openNonstopProgress({ id: 'export_image', message: langFile.converting });
  const defaultFileName = (currentFileManager.getName() || 'untitled').replace('/', ':');
  const { width, height } = workareaManager
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
  const getContent = () => {
    const buffer = Buffer.from(base64, 'base64');
    const blob = new Blob([buffer]);
    return blob;
  };
  Progress.popById('export_image');
  if (type === 'png') {
    dialog.writeFileDialog(getContent, langFile.save_png, defaultFileName, [
      { name: window.os === 'MacOS' ? `${langFile.png_files} (*.png)` : langFile.png_files, extensions: ['png'] },
      { name: langFile.all_files, extensions: ['*'] },
    ]);
  } else if (type === 'jpg') {
    dialog.writeFileDialog(getContent, langFile.save_jpg, defaultFileName, [
      { name: window.os === 'MacOS' ? `${langFile.jpg_files} (*.jpg)` : langFile.jpg_files, extensions: ['jpg'] },
      { name: langFile.all_files, extensions: ['*'] },
    ]);
  }
};

const toggleUnsavedChangedDialog = async (): Promise<boolean> => new Promise((resolve) => {
  communicator.send('SAVE_DIALOG_POPPED');
  if (!currentFileManager.getHasUnsavedChanges() || window.location.hash !== '#/studio/beambox') {
    resolve(true);
  } else {
    Alert.popById('unsaved_change_dialog');
    Alert.popUp({
      id: 'unsaved_change_dialog',
      message: LANG.beambox.popup.save_unsave_changed,
      buttonLabels: [LANG.alert.save, LANG.alert.dont_save, LANG.alert.cancel],
      callbacks: [
        async () => {
          if (await saveFile()) {
            resolve(true);
          }
        },
        () => {
          resolve(true);
        },
        () => {
          resolve(false);
        },
      ],
      primaryButtonIndex: 0,
    });
  }
});

export default {
  saveAsFile,
  saveFile,
  saveToCloud,
  exportAsBVG,
  exportAsSVG,
  exportAsImage,
  toggleUnsavedChangedDialog,
};
