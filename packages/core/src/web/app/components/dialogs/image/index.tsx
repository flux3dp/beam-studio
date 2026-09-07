import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { dpmm } from '@core/app/actions/beambox/constant';
import dialogCaller from '@core/app/actions/dialog-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import { getEngraveDpmm } from '@core/app/constants/resolutions';
import { useDocumentStore } from '@core/app/stores/documentStore';
import selectionManager from '@core/app/svgedit/selection';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';
import { MAX_UPSCALE_INPUT_SIZE } from '@core/helpers/image-edit';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';

import Curve from './Curve';
import RotaryWarped from './RotaryWarped';
import Sharpen from './Sharpen';
import UpscaleModal from './UpscaleModal';

const getProps = (elem?: SVGImageElement) => {
  const element = elem ?? selectionManager.getSelectedElements()[0];

  if (!element || element.tagName !== 'image') return;

  const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

  if (!src) return;

  return {
    element: element as SVGImageElement,
    src,
  };
};

export const showSharpenPanel = () =>
  webNeedConnectionWrapper(() => {
    if (isIdExist('sharpen-panel')) return;

    const data = getProps();

    if (!data) return;

    const { element, src } = data;
    const onClose = () => popDialogById('sharpen-panel');

    addDialogComponent('sharpen-panel', <Sharpen element={element} onClose={onClose} src={src} />);
  });

export const showCurvePanel = () => {
  if (isIdExist('curve-panel')) return;

  const data = getProps();

  if (!data) return;

  const { element, src } = data;
  const onClose = () => popDialogById('curve-panel');

  addDialogComponent('curve-panel', <Curve element={element} onClose={onClose} src={src} />);
};

/** Checks size and login, works out the layer-DPI recommendation, then opens the upscale dialog. */
export const showUpscaleModal = async (elem?: SVGImageElement): Promise<void> => {
  const id = 'upscale-modal';

  if (isIdExist(id)) return;

  const data = getProps(elem);

  if (!data) return;

  const { element, src } = data;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const imageSize = { height: image.naturalHeight, width: image.naturalWidth };

  if (imageSize.width * imageSize.height > MAX_UPSCALE_INPUT_SIZE ** 2) {
    alertCaller.popUp({
      message: sprintf(
        i18n.lang.beambox.right_panel.object_panel.actions_panel.ai_upscale_too_large,
        MAX_UPSCALE_INPUT_SIZE,
        MAX_UPSCALE_INPUT_SIZE,
      ),
    });

    return;
  }

  if (!getCurrentUser()) {
    dialogCaller.showLoginDialog();

    return;
  }

  // Scale needed for the image to fill its canvas size at the layer's engrave resolution.
  // Printing modules have a fixed resolution, so no recommendation is made for them.
  const layer = getObjectLayer(element)?.elem;
  const isPrinting = printingModules.has(getData(layer, 'module')!);
  const engraveDpmm = getEngraveDpmm(getData(layer, 'dpi') ?? 'medium', useDocumentStore.getState().workarea);
  const requiredScale = isPrinting
    ? 0
    : Math.max(
        ((Number(element.getAttribute('width')) / dpmm) * engraveDpmm) / imageSize.width,
        ((Number(element.getAttribute('height')) / dpmm) * engraveDpmm) / imageSize.height,
      );

  addDialogComponent(
    id,
    <UpscaleModal
      element={element}
      imageSize={imageSize}
      onClose={() => popDialogById(id)}
      requiredScale={requiredScale}
    />,
  );
};

export const showRotaryWarped = (elem?: SVGImageElement): void => {
  if (isIdExist('rotary-warped')) return;

  let targetElem = elem;

  if (!targetElem) {
    const data = getProps();

    if (!data) return;

    targetElem = data.element;
  }

  if (!targetElem) return;

  addDialogComponent(
    'rotary-warped',
    <RotaryWarped elem={targetElem} onClose={() => popDialogById('rotary-warped')} />,
  );
};
