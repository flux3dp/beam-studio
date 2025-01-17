import beamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import layoutConstants from 'app/constants/layout-constants';
import rotaryConstants from 'app/constants/rotary-constants';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { getSupportInfo } from 'app/constants/add-on';
import { isMobile } from 'helpers/system-helper';

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
const zoomBlockEventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

class WorkareaManager {
  model: WorkAreaModel;

  rotaryExtended: boolean;

  width: number; // px

  height: number; // px

  zoomRatio = 1;

  canvasExpansion = 3; // extra space

  expansion: number[] = [0, 0]; // [top, bottom] in pixel

  lastZoomIn = 0;

  init(model: WorkAreaModel): void {
    this.setWorkarea(model);
  }

  setWorkarea(model: WorkAreaModel): void {
    const rotaryExtended =
      !!beamboxPreference.read('rotary_mode') && beamboxPreference.read('extend-rotary-workarea');
    const supportInfo = getSupportInfo(model);
    const borderless = !!beamboxPreference.read('borderless');
    const passThrough = !!beamboxPreference.read('pass-through');
    const passThroughMode =
      supportInfo.passThrough && passThrough && (supportInfo.openBottom ? borderless : true);
    const workarea = getWorkarea(model);
    const modelChanged = this.model !== model;
    this.model = model;
    this.rotaryExtended = rotaryExtended;
    this.width = workarea.pxWidth;
    this.height = workarea.pxDisplayHeight ?? workarea.pxHeight;
    this.expansion = [0, 0];
    const { dpmm } = constant;
    if (rotaryExtended && rotaryConstants[model]) {
      const { boundary, maxHeight } = rotaryConstants[model];
      const [lowerBound, upperBound] = boundary
        ? [boundary[0] * dpmm, boundary[1] * dpmm]
        : [0, this.height];
      const pxMaxHeight = maxHeight * dpmm;
      this.expansion = [pxMaxHeight - lowerBound, pxMaxHeight - (this.height - upperBound)];
      this.height += this.expansion[1];
    } else if (passThroughMode) {
      const passThroughHeight = beamboxPreference.read('pass-through-height');
      if (passThroughHeight && passThroughHeight * dpmm > this.height) {
        const expansion = passThroughHeight * dpmm - this.height;
        this.expansion = [0, expansion];
        this.height += expansion;
      }
    }
    const svgcontent = document.getElementById('svgcontent');
    svgcontent?.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    const fixedSizeSvg = document.getElementById('fixedSizeSvg');
    fixedSizeSvg?.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.zoom(this.zoomRatio);
    canvasEvents.emit('canvas-change');
    if (modelChanged) canvasEvents.emit('model-changed', model);
  }

  zoom(zoomRatio: number, staticPoint?: { x: number; y: number }): void {
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
    const svgroot = document.getElementById('svgroot');
    svgroot?.setAttribute('x', x.toString());
    svgroot?.setAttribute('y', y.toString());
    svgroot?.setAttribute('width', rootW.toString());
    svgroot?.setAttribute('height', rootH.toString());

    const svgCanvas = document.getElementById('svgcanvas');
    const workareaElem = document.getElementById('workarea');
    svgCanvas.style.width = `${Math.max(workareaElem.clientWidth, rootW)}px`;
    svgCanvas.style.height = `${Math.max(workareaElem.clientHeight, rootH)}px`;

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

    // eslint-disable-next-line no-param-reassign
    staticPoint = staticPoint ?? {
      x: workareaElem.clientWidth / 2,
      y: workareaElem.clientHeight / 2,
    };
    const oldScroll = { x: workareaElem.scrollLeft, y: workareaElem.scrollTop };
    const zoomChanged = targetZoom / oldZoomRatio;
    workareaElem.scrollLeft = (oldScroll.x + staticPoint.x) * zoomChanged - staticPoint.x;
    workareaElem.scrollTop = (oldScroll.y + staticPoint.y) * zoomChanged - staticPoint.y;

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
    const background = document.getElementById('canvasBackground');
    if (!background) {
      setTimeout(() => this.resetView(), 100);
      return;
    }
    const { width, height } = this;
    const hasRulers = !!beamboxPreference.read('show_rulers');
    const sidePanelsWidth = isMobile()
      ? 0
      : layoutConstants.sidePanelsWidth + (hasRulers ? layoutConstants.rulerWidth : 0);
    const topBarHeight =
      layoutConstants.topBarHeight + (hasRulers ? layoutConstants.rulerWidth : 0);
    const workareaToDimensionRatio = Math.min(
      (window.innerWidth - sidePanelsWidth) / width,
      (window.innerHeight - topBarHeight) / height
    );
    const zoomLevel = workareaToDimensionRatio * 0.95;
    const workAreaWidth = width * zoomLevel;
    const workAreaHeight = height * zoomLevel;
    const offsetX =
      (window.innerWidth - sidePanelsWidth - workAreaWidth) / 2 +
      (hasRulers ? layoutConstants.rulerWidth : 0);
    const offsetY =
      (window.innerHeight - topBarHeight - workAreaHeight) / 2 +
      (hasRulers ? layoutConstants.rulerWidth : 0);
    this.zoom(zoomLevel);
    const x = parseFloat(background.getAttribute('x'));
    const y = parseFloat(background.getAttribute('y'));
    const defaultScroll = {
      x: (x - offsetX) / zoomLevel,
      y: (y - offsetY) / zoomLevel,
    };
    const workArea = document.getElementById('workarea');
    workArea.scrollLeft = defaultScroll.x * zoomLevel;
    workArea.scrollTop = defaultScroll.y * zoomLevel;
  };
}

// singleton
const workareaManager = new WorkareaManager();

export default workareaManager;
