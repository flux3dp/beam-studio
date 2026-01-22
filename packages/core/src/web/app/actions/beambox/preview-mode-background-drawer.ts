import type { ObservableInput } from 'rxjs';
import { from, Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import Constant from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import NS from '@core/app/constants/namespaces';
import { setCameraPreviewState } from '@core/app/stores/cameraPreview';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import { clearBackgroundImage, getBackgroundUrl, setBackgroundImage } from '@core/app/svgedit/canvasBackground';
import workareaManager from '@core/app/svgedit/workarea';
import { getAbsRect } from '@core/helpers/boundary-helper';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { CameraParameters } from '@core/interfaces/Camera';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const IOS_CANVAS_LIMIT = 16777216;

class PreviewModeBackgroundDrawer {
  private hybridDescText?: SVGTextElement;
  private rotaryPreviewBoundaryText?: SVGTextElement;
  private previewDescText?: SVGTextElement;
  private openBottomDescText?: SVGTextElement;

  protected canvas: HTMLCanvasElement;
  protected canvasRatio = 1;
  protected cameraCanvasUrl: string;
  protected coordinates: { maxX: number; maxY: number; minX: number; minY: number };
  protected cameraOffset: CameraParameters | null;
  protected backgroundDrawerSubject: Subject<ObservableInput<Blob>>;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvasRatio = 1;
    this.cameraCanvasUrl = '';
    this.coordinates = { maxX: 0, maxY: 0, minX: 10000, minY: 10000 };
    this.backgroundDrawerSubject = new Subject();
    this.cameraOffset = null;

    this.updateCanvasSize();
    canvasEventEmitter.on('model-changed', this.updateCanvasSize);
    useStorageStore.subscribe(
      (state) => state['active-lang'],
      () => this.updateLang(),
    );
  }

  private updateRatio() {
    const { modelHeight, width } = workareaManager;

    // if is IOS system (web version), set ratio for canvas limit
    if (navigator.maxTouchPoints > 1 && getOS() === 'MacOS') {
      if (width * modelHeight > IOS_CANVAS_LIMIT) {
        this.canvasRatio = Math.floor(1000 * Math.sqrt(IOS_CANVAS_LIMIT / (width * modelHeight))) / 1000;
      }
    }
  }

  private updateLang = () => {
    const lang = i18n.lang.beambox.left_panel;

    if (this.rotaryPreviewBoundaryText) {
      this.rotaryPreviewBoundaryText.textContent = lang.unpreviewable_area;
    }

    if (this.previewDescText) {
      this.previewDescText.textContent = lang.unpreviewable_area;
    }

    if (this.hybridDescText) {
      this.hybridDescText.textContent = lang.diode_blind_area;
    }

    if (this.openBottomDescText) {
      this.openBottomDescText.textContent = lang.borderless_blind_area;
    }
  };

  start(cameraOffset?: CameraParameters) {
    if (cameraOffset) {
      this.cameraOffset = cameraOffset;
    } else {
      this.cameraOffset = null;
    }

    const currentCanvasRatio = this.canvasRatio;

    this.updateRatio();

    if (!useGlobalPreferenceStore.getState()['keep-preview-result'] || currentCanvasRatio !== this.canvasRatio) {
      // which also clear the canvas
      this.updateCanvasSize();
    }

    this.backgroundDrawerSubject = new Subject();
    this.backgroundDrawerSubject.pipe(concatMap((o) => from(o))).subscribe(this.drawBlobToBackground);
  }

  end() {
    this.backgroundDrawerSubject?.complete();
  }

  async drawFullWorkarea(imgUrl: string, callBack = () => {}) {
    this.backgroundDrawerSubject.next(this.preprocessFullWorkareaImg(imgUrl, callBack));
  }

  /**
   * drawImageToCanvas
   * @param sourceCanvas
   * @param x x center in px
   * @param y y center in px
   * @param opts {
   *   @param opacityMerge: boolean whether to merge the image overlapping part with opacity
   *   @param callback: () => void callback function after the image is drawn
   * }
   */
  drawImageToCanvas = async (
    sourceCanvas: HTMLCanvasElement,
    x: number,
    y: number,
    { callback, opacityMerge = false }: { callback?: () => void; opacityMerge?: boolean } = {},
  ): Promise<void> => {
    const promise = new Promise<Blob>((resolve) => {
      const { height, width } = sourceCanvas;
      const { canvasRatio } = this;
      const minX = (x - width / 2) * canvasRatio;
      const maxX = (x + width / 2) * canvasRatio;
      const minY = (y - height / 2) * canvasRatio;
      const maxY = (y + height / 2) * canvasRatio;

      if (maxX > this.coordinates.maxX) {
        this.coordinates.maxX = maxX;
      }

      if (minX < this.coordinates.minX) {
        this.coordinates.minX = Math.max(minX, 0);
      }

      if (maxY > this.coordinates.maxY) {
        this.coordinates.maxY = maxY;
      }

      if (minY < this.coordinates.minY) {
        this.coordinates.minY = Math.max(minY, 0);
      }

      if (!opacityMerge) {
        this.canvas.getContext('2d')!.drawImage(sourceCanvas, minX, minY, width * canvasRatio, height * canvasRatio);
      } else {
        if (canvasRatio < 1) {
          const scaledCanvas = document.createElement('canvas');

          scaledCanvas.width = width * canvasRatio;
          scaledCanvas.height = height * canvasRatio;

          const scaledContext = scaledCanvas.getContext('2d', { willReadFrequently: true })!;

          scaledContext.drawImage(sourceCanvas, 0, 0, width * canvasRatio, height * canvasRatio);

          sourceCanvas = scaledCanvas;
        }

        const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
        const sourceData = sourceCtx.getImageData(0, 0, width * canvasRatio, height * canvasRatio);
        const mainContext = this.canvas.getContext('2d', { willReadFrequently: true })!;
        const mainImageData = mainContext.getImageData(minX, minY, width * canvasRatio, height * canvasRatio);

        for (let i = 0; i < mainImageData.data.length; i += 4) {
          const imgA = sourceData.data[i + 3];
          const mainA = Math.min(mainImageData.data[i + 3], 255 - imgA);
          const newA = imgA + mainA;

          mainImageData.data[i + 3] = newA;

          if (newA > 0) {
            mainImageData.data[i] = (sourceData.data[i] * imgA + mainImageData.data[i] * mainA) / newA;
            mainImageData.data[i + 1] = (sourceData.data[i + 1] * imgA + mainImageData.data[i + 1] * mainA) / newA;
            mainImageData.data[i + 2] = (sourceData.data[i + 2] * imgA + mainImageData.data[i + 2] * mainA) / newA;
          }
        }
        mainContext.putImageData(mainImageData, minX, minY);
      }

      this.canvas.toBlob((blob) => {
        resolve(blob!);

        if (callback) {
          setTimeout(callback, 1000);
        }
      });
    });

    this.backgroundDrawerSubject.next(promise);

    await promise;
  };

  /**
   * change the size of the canvas (which also clear the canvas)
   */
  updateCanvasSize = () => {
    const { modelHeight, width } = workareaManager;

    this.clear();
    this.canvas.width = Math.round(width * this.canvasRatio);
    this.canvas.height = Math.round(modelHeight * this.canvasRatio);
    this.resetBoundary();
  };

  resetBoundary() {
    const previewBoundary = document.getElementById('previewBoundary');

    if (previewBoundary) {
      previewBoundary.remove();
      this.drawBoundary();
    }
  }

  setTextStyle(text: SVGTextElement) {
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#fff');
    text.setAttribute('stroke', '#666');
    text.setAttribute('stroke-width', '5');
    text.setAttribute('paint-order', 'stroke');
  }

  drawBoundary() {
    const boundaryGroup = document.createElementNS(NS.SVG, 'g');
    const fixedSizeSvg = document.getElementById('fixedSizeSvg');
    const { expansion, height, maxY, minY, modelHeight, width } = workareaManager;

    if (!fixedSizeSvg) {
      return;
    }

    boundaryGroup.id = 'previewBoundary';
    boundaryGroup.setAttribute('style', 'pointer-events:none');
    fixedSizeSvg.insertBefore(boundaryGroup, fixedSizeSvg.firstChild);

    const d = getAbsRect(0, minY, width, 0) + getAbsRect(0, modelHeight, width, maxY);

    if (d) {
      const rotaryPreviewBoundary = document.createElementNS(NS.SVG, 'path');

      rotaryPreviewBoundary.setAttribute('d', d);
      rotaryPreviewBoundary.setAttribute('fill', '#CCC');
      rotaryPreviewBoundary.setAttribute('fill-opacity', '0.4');
      boundaryGroup.appendChild(rotaryPreviewBoundary);

      const rotaryPreviewBoundaryText = document.createElementNS(NS.SVG, 'text') as SVGTextElement;

      rotaryPreviewBoundaryText.setAttribute('font-size', expansion[1] ? '400' : '100');
      rotaryPreviewBoundaryText.textContent = i18n.lang.beambox.left_panel.unpreviewable_area;
      this.setTextStyle(rotaryPreviewBoundaryText);
      boundaryGroup.appendChild(rotaryPreviewBoundaryText);

      const { height: textH, width: textW } = rotaryPreviewBoundaryText.getBBox();
      const x = (width - textW) / 2;
      const y = expansion[1] ? height - (expansion[1] - textH) / 2 : (textH - expansion[0]) / 2;

      rotaryPreviewBoundaryText.setAttribute('x', x.toString());
      rotaryPreviewBoundaryText.setAttribute('y', y.toString());
      this.rotaryPreviewBoundaryText = rotaryPreviewBoundaryText;
    }

    if (this.cameraOffset) {
      const color = 'rgba(204,204,204,0.8)';
      const stripeColor = 'rgba(102,102,102,0.8)';
      const stripeWidth = 60;
      const uncapturabledHeight =
        this.cameraOffset.y * Constant.dpmm - (Constant.camera.imgHeight * this.cameraOffset.scaleRatioY) / 2;
      const borderTop = document.createElementNS(NS.SVG, 'rect');
      const borderPattern = document.createElementNS(NS.SVG, 'pattern');
      const patternRect = document.createElementNS(NS.SVG, 'rect');
      const patternLine = document.createElementNS(NS.SVG, 'line');
      const descText = document.createElementNS(NS.SVG, 'text');

      borderPattern.id = 'border-pattern';
      borderPattern.setAttribute('width', stripeWidth.toString());
      borderPattern.setAttribute('height', stripeWidth.toString());
      borderPattern.setAttribute('patternUnits', 'userSpaceOnUse');
      borderPattern.setAttribute('patternTransform', 'rotate(45 100 100)');

      patternRect.id = 'pattern-rect';
      patternRect.setAttribute('width', stripeWidth.toString());
      patternRect.setAttribute('height', stripeWidth.toString());
      patternRect.setAttribute('fill', color);

      patternLine.id = 'pattern-line';
      patternLine.setAttribute('x1', '0');
      patternLine.setAttribute('y1', '0');
      patternLine.setAttribute('x2', '0');
      patternLine.setAttribute('y2', stripeWidth.toString());
      patternLine.setAttribute('stroke', stripeColor);
      patternLine.setAttribute('stroke-width', stripeWidth.toString());
      patternLine.setAttribute('patternUnits', 'userSpaceOnUse');

      borderTop.setAttribute('width', width.toString());
      borderTop.setAttribute('height', uncapturabledHeight.toString());
      borderTop.setAttribute('x', '0');
      borderTop.setAttribute('y', '0');
      borderTop.setAttribute('fill', 'url(#border-pattern)');

      descText.setAttribute('font-size', '60');
      descText.setAttribute('x', ((uncapturabledHeight - 60) / 2).toString());
      descText.setAttribute('y', ((uncapturabledHeight + 60) / 2 - 10).toString());
      this.setTextStyle(descText as SVGTextElement);
      descText.textContent = i18n.lang.beambox.left_panel.unpreviewable_area;
      borderPattern.appendChild(patternRect);
      borderPattern.appendChild(patternLine);
      boundaryGroup.appendChild(borderTop);

      const documentState = useDocumentStore.getState();

      if (documentState['enable-diode'] && getAddOnInfo(workareaManager.model).hybridLaser) {
        const { hybridBorder, hybridDescText } = this.getHybridModulePreviewBoundary(uncapturabledHeight);

        boundaryGroup.appendChild(hybridBorder);
        boundaryGroup.appendChild(hybridDescText);
      } else if (documentState.borderless) {
        const { openBottomBoundary, openBottomDescText } = this.getOpenBottomModulePreviewBoundary(uncapturabledHeight);

        boundaryGroup.appendChild(openBottomBoundary);
        boundaryGroup.appendChild(openBottomDescText);
      }

      boundaryGroup.appendChild(borderPattern);
      boundaryGroup.appendChild(descText);
      this.previewDescText = descText;
    }
  }

  clearBoundary() {
    document.getElementById('previewBoundary')?.remove();
  }

  isClean() {
    return this.cameraCanvasUrl === '';
  }

  clear() {
    if (this.isClean()) {
      return;
    }

    clearBackgroundImage();

    // clear canvas
    this.canvas.getContext('2d')!.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // reset cameraCanvasUrl
    URL.revokeObjectURL(this.cameraCanvasUrl);

    this.cameraCanvasUrl = '';
    setCameraPreviewState({ isClean: true });
  }

  getCameraCanvasUrl({ useCache = true }: { useCache?: boolean } = {}): Promise<string> {
    return getBackgroundUrl(this.canvas.width, this.canvas.height, { useCache });
  }

  getCoordinates() {
    return this.coordinates;
  }

  resetCoordinates() {
    this.coordinates.maxX = 0;
    this.coordinates.maxY = 0;
    this.coordinates.minX = 10000;
    this.coordinates.minY = 10000;
  }

  drawBlobToBackground = (blob: Blob) => {
    if (this.cameraCanvasUrl) {
      URL.revokeObjectURL(this.cameraCanvasUrl);
    }

    this.cameraCanvasUrl = URL.createObjectURL(blob);
    setCameraPreviewState({ isClean: false });

    setBackgroundImage(this.cameraCanvasUrl);
  };

  setCanvasUrl = (url: string) => {
    if (this.cameraCanvasUrl) {
      URL.revokeObjectURL(this.cameraCanvasUrl);
    }

    this.cameraCanvasUrl = url;
    setCameraPreviewState({ isClean: false });
    setBackgroundImage(this.cameraCanvasUrl);
  };

  preprocessFullWorkareaImg = async (imgUrl: string, callBack = () => {}) =>
    new Promise<Blob>((resolve) => {
      const img = new Image();

      img.onload = () => {
        // free unused blob memory
        URL.revokeObjectURL(imgUrl);

        const imgDpmm = 5;
        const canvasDpmm = 10;
        const imageRatio = canvasDpmm / imgDpmm;

        // assuming the left-top corner of the image is the correct
        this.canvas
          .getContext('2d')!
          .drawImage(img, 0, 0, img.naturalWidth * imageRatio, img.naturalHeight * imageRatio);
        this.coordinates.minX = 0;
        this.coordinates.minY = 0;
        this.coordinates.maxX = img.naturalWidth * imageRatio;
        this.coordinates.maxY = img.naturalHeight * imageRatio;
        this.canvas.toBlob((blob) => {
          resolve(blob!);
          setTimeout(callBack, 1000);
        });
      };
      img.src = imgUrl;
    });

  getOpenBottomModulePreviewBoundary(uncapturabledHeight: number) {
    const svgdoc = document.getElementById('svgcanvas')!.ownerDocument;
    const openBottomBoundary = svgdoc.createElementNS(NS.SVG, 'rect');
    const openBottomDescText = svgdoc.createElementNS(NS.SVG, 'text');
    const { height, width } = workareaManager;

    svgCanvas.assignAttributes(openBottomBoundary, {
      fill: 'url(#border-pattern)',
      height,
      style: 'pointer-events:none',
      width: Constant.borderless.safeDistance.X * Constant.dpmm,
      x: width - Constant.borderless.safeDistance.X * Constant.dpmm,
      y: 0,
    });

    this.setTextStyle(openBottomDescText as SVGTextElement);
    svgCanvas.assignAttributes(openBottomDescText, {
      'font-size': 60,
      'text-anchor': 'end',
      x: width - (uncapturabledHeight - 60) / 2,
      y: (uncapturabledHeight + 60) / 2 - 10,
    });
    openBottomDescText.textContent = i18n.lang.beambox.left_panel.borderless_blind_area;
    this.openBottomDescText = openBottomDescText;

    return { openBottomBoundary, openBottomDescText };
  }

  getHybridModulePreviewBoundary(uncapturabledHeight: number) {
    const svgdoc = document.getElementById('svgcanvas')!.ownerDocument;
    const hybridBorder = svgdoc.createElementNS(NS.SVG, 'rect');
    const hybridDescText = svgdoc.createElementNS(NS.SVG, 'text') as SVGTextElement;
    const { height, width } = workareaManager;

    svgCanvas.assignAttributes(hybridBorder, {
      fill: 'url(#border-pattern)',
      height,
      style: 'pointer-events:none',
      width: Constant.diode.safeDistance.X * Constant.dpmm,
      x: width - Constant.diode.safeDistance.X * Constant.dpmm,
      y: 0,
    });
    svgCanvas.assignAttributes(hybridDescText, {
      'font-size': 60,
      style: 'pointer-events:none',
      'text-anchor': 'end',
      x: width - (uncapturabledHeight - 60) / 2,
      y: (uncapturabledHeight + 60) / 2 - 10,
    });
    this.setTextStyle(hybridDescText);
    hybridDescText.textContent = i18n.lang.beambox.left_panel.diode_blind_area;
    this.hybridDescText = hybridDescText;

    return { hybridBorder, hybridDescText };
  }
}

const previewModeBackgroundDrawer = new PreviewModeBackgroundDrawer();

export default previewModeBackgroundDrawer;
