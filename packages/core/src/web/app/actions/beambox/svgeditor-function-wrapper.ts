import TutorialConstants from '@core/app/constants/tutorial-constants';
import * as TutorialController from '@core/app/views/tutorials/tutorialController';
import i18n from '@core/helpers/i18n';
import ImageData from '@core/helpers/image-data';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import dialog from '@core/implementations/dialog';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
let svgEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const LANG = i18n.lang.beambox;

const setCrosshairCursor = () => {
  $('#workarea').css('cursor', 'crosshair');
  $('#svg_editor g').css('cursor', 'crosshair');
};

const align = (types) => {
  if (svgCanvas.getTempGroup()) {
    const childeren = svgCanvas.ungroupTempGroup();

    svgCanvas.selectOnly(childeren, false);
  }

  const selectedElements = svgCanvas.getSelectedElems();
  const len = selectedElements.filter((e) => e).length;
  const mode = len > 1 ? 'selected' : 'page';

  svgCanvas.alignSelectedElements(types, mode);
  svgCanvas.tempGroupSelectedElements();
};

const funcs = {
  alignBottom(): void {
    align('b');
  },
  alignCenter(): void {
    align('c');
  },
  // align toolbox
  alignLeft(): void {
    align('l');
  },

  alignMiddle(): void {
    align('m');
  },
  alignRight(): void {
    align('r');
  },
  alignTop(): void {
    align('t');
  },
  clearSelection(): void {
    svgCanvas.clearSelection();
  },
  // main panel
  importImage: async (): Promise<void> => {
    const file = await dialog.getFileFromDialog({
      filters: [
        {
          extensions: [
            'png',
            'jpg',
            'jpeg',
            'jpe',
            'jif',
            'jfif',
            'jfi',
            'bmp',
            'jp2',
            'j2k',
            'jpf',
            'jpx',
            'jpm',
            'dxf',
            'ai',
            'pdf',
            'svg',
            'bvg',
            'beam',
            'webp',
          ],
          name: 'Images',
        },
      ],
    });

    if (file) {
      svgEditor.handleFile(file);
    }

    svgEditor.clickSelect();
  },
  insertEllipse(): void {
    if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_CIRCLE) {
      TutorialController.handleNextStep();
    }

    svgCanvas.setMode('ellipse');
    setCrosshairCursor();
  },
  insertImage(
    insertedImageSrc: string,
    dimension: { height: number; width: number; x: number; y: number },
    threshold = 255,
    options: { ratioFixed?: boolean; useCurrentLayer?: boolean } = {},
  ): void {
    const img = new Image();
    const layerName = LANG.right_panel.layer_panel.layer_bitmap;
    const { ratioFixed = false, useCurrentLayer = false } = options;

    img.src = insertedImageSrc;
    img.style.opacity = '0';
    img.onload = () => {
      if (!useCurrentLayer && !svgCanvas.setCurrentLayer(layerName)) {
        createLayer(layerName);
      }

      const { height, width, x, y } = dimension;
      const newImage = svgCanvas.addSvgElementFromJson({
        attr: {
          'data-ratiofixed': ratioFixed ? 'true' : 'false',
          'data-shading': false,
          'data-threshold': threshold,
          height,
          id: svgCanvas.getNextId(),
          origImage: img.src,
          preserveAspectRatio: 'none',
          style: 'pointer-events:inherit',
          width,
          x,
          y,
        },
        element: 'image',
      });

      ImageData(newImage.getAttribute('origImage'), {
        grayscale: {
          is_rgba: true,
          is_shading: false,
          is_svg: false,
          threshold,
        },
        height,
        onComplete(result) {
          svgCanvas.setHref(newImage, result.pngBase64);
        },
        width,
      });
      svgCanvas.updateElementColor(newImage);
      svgCanvas.selectOnly([newImage]);

      window.updateContextPanel();
    };
  },
  insertLine(): void {
    svgCanvas.setMode('line');
    setCrosshairCursor();
  },
  insertPath(): void {
    svgCanvas.setMode('path');
    setCrosshairCursor();
  },
  insertPolygon(): void {
    svgCanvas.setMode('polygon');
    setCrosshairCursor();
  },
  insertRectangle(): void {
    if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_RECT) {
      TutorialController.handleNextStep();
    }

    svgCanvas.setMode('rect');
    setCrosshairCursor();
  },
  insertText(): void {
    svgCanvas.setMode('text');
    $('#workarea').css('cursor', 'text');
  },
  // left panel
  useSelectTool(): void {
    svgEditor.clickSelect();
  },
};

export default funcs;
