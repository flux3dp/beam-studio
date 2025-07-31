import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import Curve from './Curve';
import RotaryWarped from './RotaryWarped';
import Sharpen from './Sharpen';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const getProps = () => {
  const selectedElements = svgCanvas.getSelectedElems();
  const [element] = selectedElements;

  if (!element || element.tagName !== 'image') return;

  const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');

  if (!src) return;

  return {
    element: element as SVGImageElement,
    src,
  };
};

export const showSharpenPanel = () => {
  if (isIdExist('sharpen-panel')) return;

  const data = getProps();

  if (!data) return;

  const { element, src } = data;
  const onClose = () => popDialogById('sharpen-panel');

  addDialogComponent('sharpen-panel', <Sharpen element={element} onClose={onClose} src={src} />);
};

export const showCurvePanel = () => {
  if (isIdExist('curve-panel')) return;

  const data = getProps();

  if (!data) return;

  const { element, src } = data;
  const onClose = () => popDialogById('curve-panel');

  addDialogComponent('curve-panel', <Curve element={element} onClose={onClose} src={src} />);
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
