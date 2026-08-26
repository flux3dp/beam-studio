import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import selectionManager from '@core/app/svgedit/selection';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';

import Curve from './Curve';
import RotaryWarped from './RotaryWarped';
import Sharpen from './Sharpen';
import UpscaleModal from './UpscaleModal';

const getProps = () => {
  const element = selectionManager.getSelectedElements()[0];

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

/**
 * Shows the upscale scale-picker dialog (2x / 4x).
 * @returns The chosen scale, or null if cancelled.
 */
export const showUpscaleModal = (): Promise<null | number> =>
  new Promise((resolve) => {
    const id = 'upscale-modal';

    if (isIdExist(id)) {
      resolve(null);

      return;
    }

    addDialogComponent(
      id,
      <UpscaleModal
        onCancel={() => {
          popDialogById(id);
          resolve(null);
        }}
        onOk={(scale) => {
          popDialogById(id);
          resolve(scale);
        }}
      />,
    );
  });

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
