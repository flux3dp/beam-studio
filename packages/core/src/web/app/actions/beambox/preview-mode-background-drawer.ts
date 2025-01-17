import { ObservableInput, Subject, from } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import beamboxStore from 'app/stores/beambox-store';
import Constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import i18n from 'helpers/i18n';
import NS from 'app/constants/namespaces';
import workareaManager from 'app/svgedit/workarea';
import { CameraParameters } from 'interfaces/Camera';
import { getSupportInfo } from 'app/constants/add-on';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas;
let svgedit;

getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgedit = Edit;
});

const LANG = i18n.lang.beambox.left_panel;
const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const IOS_CANVAS_LIMIT = 16777216;

class PreviewModeBackgroundDrawer {
  protected canvas: HTMLCanvasElement;

  protected canvasRatio = 1;

  protected cameraCanvasUrl: string;

  protected coordinates: { maxX: number; maxY: number; minX: number; minY: number };

  protected cameraOffset: CameraParameters;

  protected backgroundDrawerSubject: Subject<ObservableInput<Blob>>;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvasRatio = 1;
    this.cameraCanvasUrl = '';
    this.coordinates = { maxX: 0, maxY: 0, minX: 10000, minY: 10000 };
    this.backgroundDrawerSubject = new Subject();
    this.cameraOffset = null;

    canvasEventEmitter.on('model-changed', this.updateCanvasSize);
  }

  private updateRatio() {
    const { width, height, expansion } = workareaManager;
    const canvasHeight = height - expansion[1];
    // if is IOS system (web version), set ratio for canvas limit
    if (navigator.maxTouchPoints > 1 && window.os === 'MacOS') {
      if (width * canvasHeight > IOS_CANVAS_LIMIT) {
        this.canvasRatio =
          Math.floor(1000 * Math.sqrt(IOS_CANVAS_LIMIT / (width * canvasHeight))) / 1000;
      }
    }
  }

  start(cameraOffset?: CameraParameters) {
    if (cameraOffset) {
      this.cameraOffset = cameraOffset;
    }

    const currentCanvasRatio = this.canvasRatio;

    this.updateRatio();

    if (!BeamboxPreference.read('keep-preview-result') || currentCanvasRatio !== this.canvasRatio) {
      // which also clear the canvas
      this.updateCanvasSize();
    }

    this.backgroundDrawerSubject = new Subject();
    this.backgroundDrawerSubject
      .pipe(concatMap((o) => from(o)))
      .subscribe(this.drawBlobToBackground);
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
    { opacityMerge = false, callback }: { opacityMerge?: boolean; callback?: () => void } = {}
  ): Promise<void> => {
    const promise = new Promise<Blob>((resolve) => {
      const { width, height } = sourceCanvas;
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
        this.canvas
          .getContext('2d')
          .drawImage(sourceCanvas, minX, minY, width * canvasRatio, height * canvasRatio);
      } else {
        if (canvasRatio < 1) {
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = width * canvasRatio;
          scaledCanvas.height = height * canvasRatio;
          const scaledContext = scaledCanvas.getContext('2d', { willReadFrequently: true });
          scaledContext.drawImage(sourceCanvas, 0, 0, width * canvasRatio, height * canvasRatio);
          // eslint-disable-next-line no-param-reassign
          sourceCanvas = scaledCanvas;
        }
        const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
        const sourceData = sourceCtx.getImageData(0, 0, width * canvasRatio, height * canvasRatio);
        const mainContext = this.canvas.getContext('2d', { willReadFrequently: true });
        const mainImageData = mainContext.getImageData(
          minX,
          minY,
          width * canvasRatio,
          height * canvasRatio
        );
        for (let i = 0; i < mainImageData.data.length; i += 4) {
          const imgA = sourceData.data[i + 3];
          const mainA = Math.min(mainImageData.data[i + 3], 255 - imgA);
          const newA = imgA + mainA;
          mainImageData.data[i + 3] = newA;
          if (newA > 0) {
            mainImageData.data[i] =
              (sourceData.data[i] * imgA + mainImageData.data[i] * mainA) / newA;
            mainImageData.data[i + 1] =
              (sourceData.data[i + 1] * imgA + mainImageData.data[i + 1] * mainA) / newA;
            mainImageData.data[i + 2] =
              (sourceData.data[i + 2] * imgA + mainImageData.data[i + 2] * mainA) / newA;
          }
        }
        mainContext.putImageData(mainImageData, minX, minY);
      }

      this.canvas.toBlob((blob) => {
        resolve(blob);

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
    const { width, height, expansion } = workareaManager;
    const canvasHeight = height - expansion[1];

    this.clear();
    this.canvas.width = Math.round(width * this.canvasRatio);
    this.canvas.height = Math.round(canvasHeight * this.canvasRatio);
    this.resetBoundary();

    if (BeamboxPreference.read('show_guides')) {
      beamboxStore.emitDrawGuideLines();
    }
  };

  resetBoundary() {
    const previewBoundary = document.getElementById('previewBoundary');

    if (previewBoundary) {
      previewBoundary.remove();
      this.drawBoundary();
    }
  }

  // eslint-disable-next-line class-methods-use-this
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
    const { width, height, expansion } = workareaManager;

    boundaryGroup.id = 'previewBoundary';
    boundaryGroup.setAttribute('style', 'pointer-events:none');
    fixedSizeSvg.insertBefore(boundaryGroup, fixedSizeSvg.firstChild);

    if (expansion[1] > 0) {
      const rotaryPreveiwBoundary = document.createElementNS(NS.SVG, 'rect');

      rotaryPreveiwBoundary.setAttribute('x', '0');
      rotaryPreveiwBoundary.setAttribute('y', (height - expansion[1]).toString());
      rotaryPreveiwBoundary.setAttribute('width', width.toString());
      rotaryPreveiwBoundary.setAttribute('height', expansion[1].toString());
      rotaryPreveiwBoundary.setAttribute('fill', '#CCC');
      rotaryPreveiwBoundary.setAttribute('fill-opacity', '0.4');
      boundaryGroup.appendChild(rotaryPreveiwBoundary);

      const rotaryPreveiwBoundaryText = document.createElementNS(NS.SVG, 'text') as SVGTextElement;
      const textNode = document.createTextNode(LANG.unpreviewable_area);

      rotaryPreveiwBoundaryText.setAttribute('font-size', '400');
      rotaryPreveiwBoundaryText.appendChild(textNode);
      this.setTextStyle(rotaryPreveiwBoundaryText);
      boundaryGroup.appendChild(rotaryPreveiwBoundaryText);

      const { width: textW, height: textH } = rotaryPreveiwBoundaryText.getBBox();
      const x = (width - textW) / 2;
      const y = height - (expansion[1] - textH) / 2;

      rotaryPreveiwBoundaryText.setAttribute('x', x.toString());
      rotaryPreveiwBoundaryText.setAttribute('y', y.toString());
    }

    if (this.cameraOffset) {
      const color = 'rgba(204,204,204,0.8)';
      const stripeColor = 'rgba(102,102,102,0.8)';
      const stripeWidth = 60;
      const uncapturabledHeight =
        this.cameraOffset.y * Constant.dpmm -
        (Constant.camera.imgHeight * this.cameraOffset.scaleRatioY) / 2;
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

      const textNode = document.createTextNode(LANG.unpreviewable_area);

      descText.appendChild(textNode);
      borderPattern.appendChild(patternRect);
      borderPattern.appendChild(patternLine);
      boundaryGroup.appendChild(borderTop);

      if (
        BeamboxPreference.read('enable-diode') &&
        getSupportInfo(BeamboxPreference.read('workarea')).hybridLaser
      ) {
        const { hybridBorder, hybridDescText } =
          this.getHybridModulePreviewBoundary(uncapturabledHeight);

        boundaryGroup.appendChild(hybridBorder);
        boundaryGroup.appendChild(hybridDescText);
      } else if (BeamboxPreference.read('borderless')) {
        const { openBottomBoundary, openBottomDescText } =
          this.getOpenBottomModulePreviewBoundary(uncapturabledHeight);

        boundaryGroup.appendChild(openBottomBoundary);
        boundaryGroup.appendChild(openBottomDescText);
      }

      boundaryGroup.appendChild(borderPattern);
      boundaryGroup.appendChild(descText);
    }
  }

  // eslint-disable-next-line class-methods-use-this
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

    svgCanvas.setBackground('#fff');

    // clear canvas
    this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
    // reset cameraCanvasUrl
    URL.revokeObjectURL(this.cameraCanvasUrl);

    this.cameraCanvasUrl = '';
  }

  getCameraCanvasUrl() {
    return this.cameraCanvasUrl;
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

    svgCanvas.setBackground('#fff', this.cameraCanvasUrl);
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
          .getContext('2d')
          .drawImage(img, 0, 0, img.naturalWidth * imageRatio, img.naturalHeight * imageRatio);
        this.coordinates.minX = 0;
        this.coordinates.minY = 0;
        this.coordinates.maxX = img.naturalWidth * imageRatio;
        this.coordinates.maxY = img.naturalHeight * imageRatio;
        this.canvas.toBlob((blob) => {
          resolve(blob);
          setTimeout(callBack, 1000);
        });
      };
      img.src = imgUrl;
    });

  // eslint-disable-next-line class-methods-use-this
  getOpenBottomModulePreviewBoundary(uncapturabledHeight) {
    const svgdoc = document.getElementById('svgcanvas').ownerDocument;
    const openBottomBoundary = svgdoc.createElementNS(NS.SVG, 'rect');
    const openBottomDescText = svgdoc.createElementNS(NS.SVG, 'text');
    const { width, height } = workareaManager;

    svgedit.utilities.assignAttributes(openBottomBoundary, {
      width: Constant.borderless.safeDistance.X * Constant.dpmm,
      height,
      x: width - Constant.borderless.safeDistance.X * Constant.dpmm,
      y: 0,
      fill: 'url(#border-pattern)',
      style: 'pointer-events:none',
    });

    this.setTextStyle(openBottomDescText as SVGTextElement);
    svgedit.utilities.assignAttributes(openBottomDescText, {
      'font-size': 60,
      x: width - (uncapturabledHeight - 60) / 2,
      y: (uncapturabledHeight + 60) / 2 - 10,
      'text-anchor': 'end',
    });

    const textNode = document.createTextNode(LANG.borderless_blind_area);

    openBottomDescText.appendChild(textNode);

    return { openBottomBoundary, openBottomDescText };
  }

  // eslint-disable-next-line class-methods-use-this
  getHybridModulePreviewBoundary(uncapturabledHeight) {
    const svgdoc = document.getElementById('svgcanvas').ownerDocument;
    const hybridBorder = svgdoc.createElementNS(NS.SVG, 'rect');
    const hybridDescText = svgdoc.createElementNS(NS.SVG, 'text');
    const { width, height } = workareaManager;

    svgedit.utilities.assignAttributes(hybridBorder, {
      width: Constant.diode.safeDistance.X * Constant.dpmm,
      height,
      x: width - Constant.diode.safeDistance.X * Constant.dpmm,
      y: 0,
      fill: 'url(#border-pattern)',
      style: 'pointer-events:none',
    });
    svgedit.utilities.assignAttributes(hybridDescText, {
      'font-size': 60,
      x: width - (uncapturabledHeight - 60) / 2,
      y: (uncapturabledHeight + 60) / 2 - 10,
      'text-anchor': 'end',
      style: 'pointer-events:none',
    });
    this.setTextStyle(hybridDescText as SVGTextElement);

    const textNode = document.createTextNode(LANG.diode_blind_area);

    hybridDescText.appendChild(textNode);

    return { hybridBorder, hybridDescText };
  }
}

const previewModeBackgroundDrawer = new PreviewModeBackgroundDrawer();

export default previewModeBackgroundDrawer;
