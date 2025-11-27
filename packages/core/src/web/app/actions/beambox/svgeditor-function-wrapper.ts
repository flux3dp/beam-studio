import tabController from '@core/app/actions/tabController';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import layerManager from '@core/app/svgedit/layer/layerManager';
import * as TutorialController from '@core/app/views/tutorials/tutorialController';
import { checkTabCount, setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import { checkIsAtEditor, hashMap, isAtPage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import ImageData from '@core/helpers/image-data';
import isWeb from '@core/helpers/is-web';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import dialog from '@core/implementations/dialog';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { ISVGEditor } from './svg-editor';

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const setCrosshairCursor = () => {
  $('#workarea').css('cursor', 'crosshair');
  $('#svg_editor g').css('cursor', 'crosshair');
};

const align = (type: 'b' | 'c' | 'l' | 'm' | 'r' | 't') => {
  if (svgCanvas.getTempGroup()) {
    const children = svgCanvas.ungroupTempGroup();

    svgCanvas.selectOnly(children, false);
  }

  const selectedElements = svgCanvas.getSelectedElems();
  const mode = selectedElements.filter(Boolean).length > 1 ? 'selected' : 'page';

  svgCanvas.alignSelectedElements(type, mode);
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
  async clearScene() {
    if (isAtPage('welcome')) {
      if (isWeb()) {
        location.hash = hashMap.editor;
      } else if (checkTabCount()) {
        tabController.addNewTab();
      }

      return;
    } else if (!checkIsAtEditor()) {
      return;
    }

    await svgEditor.clearScene();
  },
  clearSelection(): void {
    svgCanvas.clearSelection();
  },
  // main panel
  importImage: async (): Promise<void> => {
    if (isAtPage('welcome')) {
      if (!checkTabCount()) return;
    } else if (!checkIsAtEditor()) {
      return;
    }

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
      if (isAtPage('welcome')) {
        setFileInAnotherTab({ data: file, type: 'normal' });

        return;
      } else {
        svgEditor.handleFile(file);
      }
    }

    svgEditor.clickSelect();
  },
  insertEllipse(): void {
    if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_CIRCLE) {
      TutorialController.handleNextStep();
    }

    setMouseMode('ellipse');
    setCrosshairCursor();
  },
  insertImage(
    insertedImageSrc: string,
    dimension: { height: number; width: number; x: number; y: number },
    threshold = 255,
    options: { ratioFixed?: boolean; useCurrentLayer?: boolean } = {},
  ): void {
    const img = new Image();
    const layerName = i18n.lang.beambox.right_panel.layer_panel.layer_bitmap;
    const { ratioFixed = false, useCurrentLayer = false } = options;

    img.src = insertedImageSrc;
    img.style.opacity = '0';
    img.onload = () => {
      if (!useCurrentLayer && !layerManager.setCurrentLayer(layerName)) {
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

      ImageData(newImage.getAttribute('origImage')!, {
        grayscale: { is_rgba: true, is_shading: false, is_svg: false, threshold },
        height,
        onComplete(result: any) {
          svgCanvas.setHref(newImage, result.pngBase64);
        },
        width,
      });
      svgCanvas.updateElementColor(newImage);
      svgCanvas.selectOnly([newImage]);

      (window as any).updateContextPanel();
    };
  },
  insertLine(): void {
    setMouseMode('line');
    setCrosshairCursor();
  },
  insertPath(): void {
    setMouseMode('path');
    setCrosshairCursor();
  },
  insertPolygon(): void {
    setMouseMode('polygon');
    setCrosshairCursor();
  },
  insertRectangle(): void {
    if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_RECT) {
      TutorialController.handleNextStep();
    }

    setMouseMode('rect');
    setCrosshairCursor();
  },
  insertText(): void {
    setMouseMode('text');
    $('#workarea').css('cursor', 'text');
  },
  // left panel
  useSelectTool(): void {
    svgEditor.clickSelect();
  },
};

export default funcs;
