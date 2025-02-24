import selector from '@core/app/svgedit/selector';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

const { svgedit } = window;
let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function setRubberBoxStart(x: number, y: number): void {
  const selectorManager = selector.getSelectorManager();
  let rubberBox = svgCanvas.getRubberBox();

  if (!rubberBox) {
    rubberBox = selectorManager.getRubberBandBox();
    svgCanvas.unsafeAccess.setRubberBox(rubberBox);
  }

  svgedit.utilities.assignAttributes(rubberBox, { display: 'inline', height: 0, width: 0, x, y }, 100);
}
