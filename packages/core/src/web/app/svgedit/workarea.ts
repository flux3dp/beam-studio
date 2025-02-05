import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import { getSupportInfo } from '@core/app/constants/add-on';
import layoutConstants from '@core/app/constants/layout-constants';
import rotaryConstants from '@core/app/constants/rotary-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { isMobile } from '@core/helpers/system-helper';

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
const zoomBlockEventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

class WorkareaManager {
  model: WorkAreaModel = 'fbm1';
  width = 3000; // px
  height = 2100; // px

  zoomRatio = 1;
  canvasExpansion = 3; // extra space
  expansion: number[] = [0, 0]; // [top, bottom] in pixel
  lastZoomIn = 0;

  init(model: WorkAreaModel): void {
    this.setWorkarea(model);
  }

  setWorkarea(model: WorkAreaModel): void {
    const rotaryExtended = !!beamboxPreference.read('rotary_mode') && beamboxPreference.read('extend-rotary-workarea');
    const supportInfo = getSupportInfo(model);
    const borderless = !!beamboxPreference.read('borderless');
    const passThrough = !!beamboxPreference.read('pass-through');
    const passThroughMode = supportInfo.passThrough && passThrough && (supportInfo.openBottom ? borderless : true);
    const autoFeeder = Boolean(!!beamboxPreference.read('auto-feeder') && supportInfo.autoFeeder);
    const workarea = getWorkarea(model);
    const modelChanged = this.model !== model;

    this.model = model;
    this.width = workarea.pxWidth;
    this.height = workarea.pxDisplayHeight ?? workarea.pxHeight;
    this.expansion = [0, 0];

    const { dpmm } = constant;

    if (rotaryExtended && rotaryConstants[model]) {
      const { boundary, maxHeight } = rotaryConstants[model];
      const [, upperBound] = boundary ? [boundary[0] * dpmm, boundary[1] * dpmm] : [0, this.height];
      const pxMaxHeight = maxHeight * dpmm;

      // currently only extend in positive direction
      // this.expansion = [pxMaxHeight - lowerBound, pxMaxHeight - (this.height - upperBound)];
      this.expansion = [0, pxMaxHeight - (this.height - upperBound)];
      this.height += this.expansion[1];
    } else if (passThroughMode) {
      const passThroughHeight = beamboxPreference.read('pass-through-height');

      if (passThroughHeight && passThroughHeight * dpmm > this.height) {
        const expansion = passThroughHeight * dpmm - this.height;

        this.expansion = [0, expansion];
        this.height += expansion;
      }
    } else if (autoFeeder) {
      const autoFeederHeight = beamboxPreference.read('auto-feeder-height');

      if (autoFeederHeight && autoFeederHeight * dpmm > this.height) {
        const expansion = autoFeederHeight * dpmm - this.height;

        this.expansion = [0, expansion];
        this.height += expansion;
      }
    }

    const svgcontent = document.getElementById('svgcontent');
    const fixedSizeSvg = document.getElementById('fixedSizeSvg');
    const viewBox = `0 0 ${this.width} ${this.height}`;

    svgcontent?.setAttribute('viewBox', viewBox);
    fixedSizeSvg?.setAttribute('viewBox', viewBox);
    this.zoom(this.zoomRatio);
    canvasEvents.emit('canvas-change');

    if (modelChanged) canvasEvents.emit('model-changed', model);
  }

  zoom(zoomRatio: number, staticPoint?: { x: number; y: number }): void {
    const svgroot = document.getElementById('svgroot');
    const svgCanvas = document.getElementById('svgcanvas');
    const workareaElem = document.getElementById('workarea');

    if (!svgroot || !svgCanvas || !workareaElem) {
      return;
    }

    const targetZoom = Math.max(0.05, zoomRatio);
    const oldZoomRatio = this.zoomRatio;

    this.zoomRatio = targetZoom;

    const w = this.width * targetZoom;
    const h = this.height * targetZoom;
    const rootW = w * this.canvasExpansion;
    const rootH = h * this.canvasExpansion;
    const expansionRatio = (this.canvasExpansion - 1) / 2;
    const x = this.width * targetZoom * expansionRatio;
    const y = this.height * targetZoom * expansionRatio;

    svgroot?.setAttribute('x', x.toString());
    svgroot?.setAttribute('y', y.toString());
    svgroot?.setAttribute('width', rootW.toString());
    svgroot?.setAttribute('height', rootH.toString());

    if (svgCanvas && workareaElem) {
      svgCanvas.style.width = `${Math.max(workareaElem.clientWidth, rootW)}px`;
      svgCanvas.style.height = `${Math.max(workareaElem.clientHeight, rootH)}px`;
    }

    const canvasBackground = document.getElementById('canvasBackground');

    canvasBackground?.setAttribute('x', x.toString());
    canvasBackground?.setAttribute('y', y.toString());
    canvasBackground?.setAttribute('width', w.toString());
    canvasBackground?.setAttribute('height', h.toString());

    const svgcontent = document.getElementById('svgcontent');

    svgcontent?.setAttribute('x', x.toString());
    svgcontent?.setAttribute('y', y.toString());
    svgcontent?.setAttribute('width', w.toString());
    svgcontent?.setAttribute('height', h.toString());

    if (workareaElem) {
      staticPoint = staticPoint ?? {
        x: workareaElem.clientWidth / 2,
        y: workareaElem.clientHeight / 2,
      };

      const oldScroll = { x: workareaElem.scrollLeft, y: workareaElem.scrollTop };
      const zoomChanged = targetZoom / oldZoomRatio;

      workareaElem.scrollLeft = (oldScroll.x + staticPoint.x) * zoomChanged - staticPoint.x;
      workareaElem.scrollTop = (oldScroll.y + staticPoint.y) * zoomChanged - staticPoint.y;
    }

    canvasEvents.emit('zoom-changed', targetZoom, oldZoomRatio);
    zoomBlockEventEmitter.emit('UPDATE_ZOOM_BLOCK');
  }

  zoomIn = (ratio = 1.1): void => {
    const now = Date.now();

    if (now - this.lastZoomIn > 10) {
      this.zoom(this.zoomRatio * ratio);
      this.lastZoomIn = now;
    }
  };

  zoomOut = (ratio = 1.1): void => {
    this.zoom(this.zoomRatio / ratio);
  };

  resetView = () => {
    const workArea = document.getElementById('workarea');
    const background = document.getElementById('canvasBackground');

    if (!background || !workArea) {
      setTimeout(() => this.resetView(), 100);

      return;
    }

    const { height, width } = this;
    const hasRulers = !!beamboxPreference.read('show_rulers');
    const sidePanelsWidth = isMobile()
      ? 0
      : layoutConstants.sidePanelsWidth + (hasRulers ? layoutConstants.rulerWidth : 0);
    const topBarHeight = layoutConstants.topBarHeight + (hasRulers ? layoutConstants.rulerWidth : 0);
    const workareaToDimensionRatio = Math.min(
      (window.innerWidth - sidePanelsWidth) / width,
      (window.innerHeight - topBarHeight) / height,
    );
    const zoomLevel = workareaToDimensionRatio * 0.95;
    const workAreaWidth = width * zoomLevel;
    const workAreaHeight = height * zoomLevel;
    const offsetX =
      (window.innerWidth - sidePanelsWidth - workAreaWidth) / 2 + (hasRulers ? layoutConstants.rulerWidth : 0);
    const offsetY =
      (window.innerHeight - topBarHeight - workAreaHeight) / 2 + (hasRulers ? layoutConstants.rulerWidth : 0);

    this.zoom(zoomLevel);

    if (background && workArea) {
      const x = Number.parseFloat(background.getAttribute('x') ?? '0');
      const y = Number.parseFloat(background.getAttribute('y') ?? '0');
      const defaultScroll = {
        x: (x - offsetX) / zoomLevel,
        y: (y - offsetY) / zoomLevel,
      };

      workArea.scrollLeft = defaultScroll.x * zoomLevel;
      workArea.scrollTop = defaultScroll.y * zoomLevel;
    }
  };
}

// singleton
const workareaManager = new WorkareaManager();

export default workareaManager;
