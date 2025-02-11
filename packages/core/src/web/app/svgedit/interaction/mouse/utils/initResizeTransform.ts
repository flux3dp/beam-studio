import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

const { svgedit } = window;
let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function initResizeTransform(element: Element): void {
  const transforms = svgedit.transformlist.getTransformList(element);
  const pos = svgedit.utilities.getRotationAngle(element) ? 1 : 0;
  const svgRoot = svgCanvas.getRoot();

  if (svgedit.math.hasMatrixTransform(transforms)) {
    transforms.insertItemBefore(svgRoot.createSVGTransform(), pos);
    transforms.insertItemBefore(svgRoot.createSVGTransform(), pos);
    transforms.insertItemBefore(svgRoot.createSVGTransform(), pos);
  } else {
    transforms.appendItem(svgRoot.createSVGTransform());
    transforms.appendItem(svgRoot.createSVGTransform());
    transforms.appendItem(svgRoot.createSVGTransform());
  }
}
