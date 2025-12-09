// @ts-expect-error don't has type definition
import ImageTracer from 'imagetracerjs';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import progress from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { moveElements } from '@core/app/svgedit/operations/move';
import { simplifyPath } from '@core/app/svgedit/operations/pathActions';
import alertConfig from '@core/helpers/api/alert-config';
import { axiosFluxId, getCurrentUser, getDefaultHeader } from '@core/helpers/api/flux-id';
import type { ResponseWithError } from '@core/helpers/api/flux-id';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import imageData from '@core/helpers/image-data';
import jimpHelper from '@core/helpers/jimp-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const REMOVE_BACKGROUND_COST = 0.02;

const getSelectedElem = (): null | SVGImageElement => {
  const selectedElements = svgCanvas.getSelectedElems();
  const len = selectedElements.length;

  if (len > 1) return null;

  const element = selectedElements[0] as SVGImageElement;

  if (element.tagName !== 'image') return null;

  return element;
};

const getImageAttributes = (
  elem: Element,
): {
  imgUrl: string;
  isFullColor: boolean;
  shading: boolean;
  threshold: number;
} => {
  const imgUrl = (elem.getAttribute('origImage') || elem.getAttribute('xlink:href')) as string;
  const isFullColor = elem.getAttribute('data-fullcolor') === '1';
  const shading = elem.getAttribute('data-shading') === 'true';
  let threshold = Number.parseInt(elem.getAttribute('data-threshold') || '128', 10);

  if (Number.isNaN(threshold)) {
    threshold = 128;
  }

  return {
    imgUrl,
    isFullColor,
    shading,
    threshold,
  };
};

const generateBase64Image = (
  imgSrc: string,
  shading: boolean,
  threshold: number,
  isFullColor = false,
): Promise<string> =>
  new Promise<string>((resolve) => {
    imageData(imgSrc, {
      grayscale: isFullColor ? undefined : { is_rgba: true, is_shading: shading, is_svg: false, threshold },
      isFullResolution: true,
      onComplete(result: any) {
        resolve(result.pngBase64);
      },
    });
  });

const addBatchCommand = (
  commandName: string,
  elem: Element,
  changes: { [key: string]: boolean | number | string | undefined },
): IBatchCommand => {
  const batchCommand: IBatchCommand = new history.BatchCommand(commandName);
  const setAttribute = (key: string, value: any) => {
    undoManager.beginUndoableChange(key, [elem]);

    if (value === undefined) {
      elem.removeAttribute(key);
    } else {
      elem.setAttribute(key, value);
    }

    const cmd = undoManager.finishUndoableChange();

    if (!cmd.isEmpty()) {
      batchCommand.addSubCommand(cmd);
    }
  };

  Object.keys(changes).forEach((key) => {
    setAttribute(key, changes[key]);
  });

  if (!changes['data-trapezoid']) {
    setAttribute('data-trapezoid', undefined);
  }

  if (!batchCommand.isEmpty()) {
    undoManager.addCommandToHistory(batchCommand);
  }

  return batchCommand;
};

const colorInvert = async (elem?: SVGImageElement): Promise<void> => {
  const element = elem || getSelectedElem();

  if (!element) {
    return;
  }

  progress.openNonstopProgress({
    id: 'photo-edit-processing',
    message: i18n.lang.beambox.photo_edit_panel.processing,
  });

  const { imgUrl, isFullColor, shading, threshold } = getImageAttributes(element);
  const newImgUrl = await jimpHelper.colorInvert(imgUrl);

  if (newImgUrl) {
    const newThreshold = shading ? threshold : 256 - threshold;
    const base64Img = await generateBase64Image(newImgUrl, shading, newThreshold, isFullColor);

    addBatchCommand('Image Edit: invert', element, {
      'data-threshold': newThreshold,
      origImage: newImgUrl,
      'xlink:href': base64Img,
    });
    svgCanvas.selectOnly([element], true);
  }

  progress.popById('photo-edit-processing');
};

const traceImage = async (img = getSelectedElem()): Promise<void> => {
  const element = img;

  if (!element) return;

  const { imgUrl, shading, threshold } = getImageAttributes(element);

  if (shading) {
    alertCaller.popUp({ message: i18n.lang.beambox.popup.vectorize_shading_image });

    return;
  }

  const worker = new Worker(
    new URL(/* webpackChunkName: "image-tracer.worker" */ './image-tracer/image-tracer.worker.ts', import.meta.url),
  );
  let canceled = false;

  progress.openNonstopProgress({
    id: 'vectorize-image',
    message: i18n.lang.beambox.photo_edit_panel.processing,
    onCancel: () => {
      worker.terminate();
      canceled = true;
    },
  });

  const batchCmd = new history.BatchCommand('Vectorize Image');
  const imgBBox = element.getBBox();
  const angle = svgedit.utilities.getRotationAngle(element);
  const grayScaleImageData = await new Promise<any>((resolve) =>
    imageData(imgUrl, {
      grayscale: { is_rgba: true, is_shading: false, is_svg: false, threshold: shading ? 128 : threshold },
      height: Number(element.getAttribute('height')),
      isFullResolution: true,
      onComplete: (result: any) => resolve(result.data),
      width: Number(element.getAttribute('width')),
    }),
  );

  const res = await new Promise<{ data: { svg: string }; success: true } | { success: false }>((resolve) => {
    const checkCancelInterval = setInterval(() => {
      if (canceled) {
        clearInterval(checkCancelInterval);
        resolve({ success: false });
      }
    }, 1000);

    worker.postMessage({ imageData: grayScaleImageData });

    worker.onerror = (e) => {
      console.error(e);

      clearInterval(checkCancelInterval);
      resolve({ success: false });
      worker.terminate();
      alertCaller.popUpError({ message: 'Failed to trace image' });
    };

    worker.onmessage = ({ data }) => {
      clearInterval(checkCancelInterval);
      resolve({ data, success: true });
      worker.terminate();
    };
  });

  if (!res.success) return;

  const { svg: svgStr } = res.data;
  const gId = svgCanvas.getNextId();
  const g = svgCanvas.addSvgElementFromJson<SVGGElement>({ attr: { id: gId }, element: 'g' });

  ImageTracer.appendSVGString(svgStr, gId);

  svgCanvas.selectOnly([g]);

  let gBBox = g.getBBox();

  if (imgBBox.width !== gBBox.width) svgCanvas.setSvgElemSize('width', imgBBox.width);

  if (imgBBox.height !== gBBox.height) svgCanvas.setSvgElemSize('height', imgBBox.height);

  gBBox = g.getBBox();

  const dx = imgBBox.x + 0.5 * imgBBox.width - (gBBox.x + 0.5 * gBBox.width);
  const dy = imgBBox.y + 0.5 * imgBBox.height - (gBBox.y + 0.5 * gBBox.height);
  let d = '';

  for (let i = 0; i < g.childNodes.length; i++) {
    const child = g.childNodes[i] as SVGPathElement;

    if (child.getAttribute('opacity') !== '0') d += child.getAttribute('d');

    child.remove();
    i--;
  }

  g.remove();

  if (!d) {
    progress.popById('vectorize-image');
    svgCanvas.selectOnly([element]);

    return;
  }

  const path = svgCanvas.addSvgElementFromJson({
    attr: { fill: '#000000', id: svgCanvas.getNextId(), 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' },
    element: 'path',
  });

  path.setAttribute('d', d);
  moveElements([dx], [dy], [path], false);
  svgCanvas.setRotationAngle(angle, true, path);
  updateElementColor(path);
  svgCanvas.selectOnly([path], true);
  batchCmd.addSubCommand(new history.InsertElementCommand(path));

  const cmd = deleteElements([img], true);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  svgCanvas.addCommandToHistory(batchCmd);
  progress.popById('vectorize-image');
};

const removeBackground = async (elem?: SVGImageElement): Promise<void> => {
  const element = elem || getSelectedElem();

  if (!element) {
    return;
  }

  const user = getCurrentUser();

  if (!user) {
    dialogCaller.showLoginDialog();

    return;
  }

  const showBalanceAlert = () =>
    alertCaller.popUpCreditAlert({ available: user.info.credit, required: String(REMOVE_BACKGROUND_COST) });

  if ((user.info?.subscription && user.info.subscription.credit) + user.info.credit < 0.02) {
    showBalanceAlert();

    return;
  }

  if (!alertConfig.read('skip_bg_removal_warning')) {
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        checkbox: {
          callbacks: [
            () => {
              alertConfig.write('skip_bg_removal_warning', true);
              resolve(true);
            },
            () => resolve(false),
          ],
          text: i18n.lang.alert.dont_show_again,
        },
        message: i18n.lang.beambox.right_panel.object_panel.actions_panel.ai_bg_removal_reminder,
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (!res) {
      return;
    }
  }

  progress.openNonstopProgress({
    id: 'photo-edit-processing',
    message: i18n.lang.beambox.photo_edit_panel.processing,
  });

  const { imgUrl, isFullColor } = getImageAttributes(element);

  if (!imgUrl) {
    return;
  }

  const imgGet = await fetch(imgUrl);
  const imgData = await imgGet.blob();
  const form = new FormData();

  form.append('image', imgData);

  try {
    const removeResult = (await axiosFluxId.post('/api/remove-background', form, {
      headers: getDefaultHeader(),
      responseType: 'blob',
      timeout: 1000 * 60 * 3, // 3 min
      withCredentials: true,
    })) as ResponseWithError;

    if (removeResult.error) {
      const { message, response: { data, status } = {} } = removeResult.error;
      let errorDetail = '';

      if (data instanceof Blob && data.type === 'application/json') {
        errorDetail = await new Promise<string>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = (e) => {
            const str = e.target!.result as string;
            const d = JSON.parse(str) as any;

            resolve(d.detail);
          };
          reader.readAsText(data);
        });
      }

      if (status === 403 && errorDetail.startsWith('CSRF Failed')) {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          message: i18n.lang.beambox.popup.ai_credit.relogin_to_use,
          onConfirm: dialogCaller.showLoginDialog,
        });

        return;
      }

      alertCaller.popUpError({
        message: `Server Error: ${status} ${errorDetail || message}`,
      });

      return;
    }

    const contentType = removeResult.headers['content-type'];

    if (contentType === 'application/json') {
      const { info, message, status } = await new Promise<{
        info: string;
        message?: string;
        status: string;
      }>((resolve) => {
        const reader = new FileReader();

        reader.onloadend = (e) => {
          const str = e.target!.result as string;
          const d = JSON.parse(str) as any;

          resolve(d);
        };
        reader.readAsText(removeResult.data);
      });

      if (status === 'error') {
        if (info === 'NOT_LOGGED_IN') {
          dialogCaller.showLoginDialog();
        } else if (info === 'INSUFFICIENT_CREDITS') {
          showBalanceAlert();
        } else if (info === 'API_ERROR') {
          alertCaller.popUpError({ message: `API Error: ${message}` });
        } else {
          alertCaller.popUpError({ message: `Error: ${info}` });
        }
      }

      return;
    }

    if (contentType !== 'image/png') {
      console.error('unknown response type', contentType);
      alertCaller.popUpError({ message: `Unknown Response Type: ${contentType}` });

      return;
    }

    const blob = removeResult.data as Blob;
    const blobUrl = URL.createObjectURL(blob);
    const newThreshold = 254;
    const base64Img = await generateBase64Image(blobUrl, true, newThreshold, isFullColor);

    addBatchCommand('Image Edit: Remove background', element, {
      'data-no-bg': 'true',
      'data-shading': true,
      'data-threshold': newThreshold,
      origImage: blobUrl,
      'xlink:href': base64Img,
    });
    svgCanvas.selectOnly([element], true);
  } finally {
    progress.popById('photo-edit-processing');
  }
};

const potrace = async (elem?: SVGImageElement): Promise<void> => {
  const element = elem || getSelectedElem();

  if (!element) {
    return;
  }

  const worker = new Worker(
    new URL(/* webpackChunkName: "potrace.worker" */ './potrace/potrace.worker.ts', import.meta.url),
  );
  let canceled = false;

  progress.openNonstopProgress({
    id: 'potrace',
    message: i18n.lang.beambox.photo_edit_panel.processing,
    onCancel: () => {
      worker.terminate();
      canceled = true;
    },
  });

  const isTransparentBackground = elem!.getAttribute('data-no-bg');
  const imgBBox = element.getBBox();
  const imgRotation = svgedit.utilities.getRotationAngle(element);
  let { imgUrl } = getImageAttributes(element);

  if (!imgUrl) {
    progress.popById('potrace');

    return;
  }

  if (isTransparentBackground) {
    imgUrl = await generateBase64Image(imgUrl, false, 254);
  }

  const res = await new Promise<{ data: { svg: string; sx: number; sy: number }; success: true } | { success: false }>(
    (resolve) => {
      const checkCancelInterval = setInterval(() => {
        if (canceled) {
          clearInterval(checkCancelInterval);
          resolve({ success: false });
        }
      }, 1000);

      worker.postMessage({
        imgBBox: { height: imgBBox.height, width: imgBBox.width },
        imgUrl,
        method: isTransparentBackground ? 'trace' : 'posterize',
        options: { addZ: true },
      });
      worker.onerror = (e) => {
        console.error(e);
        clearInterval(checkCancelInterval);
        resolve({ success: false });
        worker.terminate();
        alertCaller.popUpError({
          message: 'Failed to potrace image',
        });
      };
      worker.onmessage = (e) => {
        clearInterval(checkCancelInterval);
        resolve({ data: e.data, success: true });
        worker.terminate();
      };
    },
  );

  if (!res.success) {
    return;
  }

  const { svg: final, sx, sy } = res.data;

  const svgStr = final.replace(/<\/?svg[^>]*>/g, '');
  const gId = svgCanvas.getNextId();
  const g = svgCanvas.addSvgElementFromJson<SVGGElement>({ attr: { id: gId }, element: 'g' });
  const svgRoot = svgCanvas.getRoot();
  const transforms = svgedit.transformlist.getTransformList(g);
  const scale = svgRoot.createSVGTransform();

  scale.setScale(sx, sy);
  transforms.insertItemBefore(scale, 0);
  g.innerHTML = svgStr;
  svgCanvas.setRotationAngle(imgRotation, true, g);
  svgCanvas.pushGroupProperties(g, false);

  const path = svgCanvas.addSvgElementFromJson({
    attr: {
      fill: '#000000',
      id: svgCanvas.getNextId(),
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    },
    element: 'path',
  }) as SVGPathElement;

  svgCanvas.selectOnly([g]);

  const dx = imgBBox.x;
  const dy = imgBBox.y;
  let fillOpacity = 0;
  let d = '';

  for (let i = 0; i < g.childNodes.length; i += 1) {
    const child = g.childNodes[i] as SVGPathElement;

    if (child.tagName === 'path') {
      const opacity = Number(child.getAttribute('fill-opacity'));

      if (opacity >= fillOpacity) {
        fillOpacity = opacity;

        const pathD = child.getAttribute('d');

        if (isTransparentBackground) {
          const longestPath = pathD!.split('M').reduce((a, b) => (a.length > b.length ? a : b));

          d = `M${longestPath}`;
        } else {
          d = pathD!;
        }
      }
    }
  }

  g.remove();
  path.setAttribute('d', d);
  path.setAttribute('d', svgCanvas.pathActions.convertPath(path, false));
  svgCanvas.pathActions.fixEnd(path);
  simplifyPath(path);
  moveElements([dx], [dy], [path], false);
  updateElementColor(path);
  svgCanvas.selectOnly([path], true);

  const batchCmd = new history.BatchCommand('Potrace Image');

  batchCmd.addSubCommand(new history.InsertElementCommand(path));
  svgCanvas.addCommandToHistory(batchCmd);
  progress.popById('potrace');
};

/**
 *
 * @param img
 * @param opts dir: 0: top-to-bottom, 1: left-to-right, 2: bottom-to-top, 3: right-to-left
 * @param opts factor: the smaller side length ratio to the larger side length, should be in (0, 1)
 * @returns
 */
const trapezoid = (
  img: HTMLCanvasElement | HTMLImageElement,
  opts: { dir?: number; factor?: number; fixSize?: boolean; returnType?: 'base64' | 'canvas' } = {},
): HTMLCanvasElement | string => {
  const { dir = 0, factor = 0.6, fixSize, returnType = 'base64' } = opts;
  const alongX = dir % 2 === 1;
  const reverse = dir > 1;
  const imageRatio = fixSize ? 1 : factor;
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(alongX ? img.width : img.width / imageRatio);
  canvas.height = Math.round(alongX ? img.height / imageRatio : img.height);

  const ctx = canvas.getContext('2d')!;
  const end = alongX ? canvas.width : canvas.height;

  for (let i = 0; i < end; i += 1) {
    const cur = (reverse ? end - i - 1 : i) / (end - 1);
    const lineRatio = factor + (1 - factor) * cur;

    if (alongX) {
      const shift = ((1 - lineRatio) * canvas.height) / 2;

      ctx.drawImage(img, i, 0, 1, img.height, i, shift, 1, lineRatio * canvas.height);
    } else {
      const shift = ((1 - lineRatio) * canvas.width) / 2;

      ctx.drawImage(img, 0, i, img.width, 1, shift, i, lineRatio * canvas.width, 1);
    }
  }

  if (returnType === 'base64') {
    return canvas.toDataURL();
  }

  return canvas;
};

const calculateTrapezoidPoints = (
  points: number[][],
  width: number,
  height: number,
  opts: { dir?: number; factor?: number; fixSize?: boolean } = {},
): number[][] => {
  const { dir = 0, factor = 0.6, fixSize } = opts;
  const alongX = dir % 2 === 1;
  const reverse = dir > 1;
  const imageRatio = fixSize ? 1 : factor;
  const imageWidth = alongX ? width : width / imageRatio;
  const imageHeight = alongX ? height / imageRatio : height;

  const res = points.map(([x, y]) => {
    let lineRatio = alongX ? x / (imageWidth - 1) : y / (imageHeight - 1);

    lineRatio = factor + (1 - factor) * (reverse ? 1 - lineRatio : lineRatio);

    const ret = [0, 0];

    if (alongX) {
      const shift = ((1 - lineRatio) * imageHeight) / 2;

      ret[0] = x;
      ret[1] = shift + lineRatio * y;
    } else {
      const shift = ((1 - lineRatio) * imageWidth) / 2;

      ret[0] = shift + lineRatio * x;
      ret[1] = y;
    }

    return ret;
  });

  return res;
};

export default {
  addBatchCommand,
  calculateTrapezoidPoints,
  colorInvert,
  generateBase64Image,
  getImageAttributes,
  potrace,
  removeBackground,
  traceImage,
  trapezoid,
};
