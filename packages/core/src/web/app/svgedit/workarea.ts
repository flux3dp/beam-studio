import { shallow } from 'zustand/shallow';

import constant from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import layoutConstants from '@core/app/constants/layout-constants';
import rotaryConstants from '@core/app/constants/rotary-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
const zoomBlockEventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

/* eslint-disable perfectionist/sort-enums */
export const enum ExpansionType {
  ROTARY = 1,
  PASS_THROUGH = 2,
  AUTO_FEEDER = 3,
  MODULE = 4,
}
/* eslint-enable perfectionist/sort-enums */

class WorkareaManager {
  model: WorkAreaModel = 'fbm1';
  /**
   * (px) The width of the work area
   */
  width = 3000;
  /**
   * (px) Total height of the work area with expansion
   */
  height = 2100;
  /**
   * (px) The height of the work area without expansion; including fixed bottom expansion for modules
   */
  modelHeight = 2100;
  /**
   * (px) The minimum Y coordinate of the work area
   */
  minY = 0;
  /**
   * (px) The maximum Y coordinate of the work area
   */
  maxY = 2100;
  /**
   * (px) The boundary of the work area, used for alignment
   */
  boundary = { maxX: 3000, maxY: 2100, minX: 0, minY: 0 };

  zoomRatio = 1;
  canvasExpansion = 3; // extra space
  expansion: number[] = [0, 0]; // [top, bottom] in pixel
  expansionType?: ExpansionType;
  lastZoomIn = 0;

  init(model: WorkAreaModel): void {
    this.setWorkarea(model);
    useDocumentStore.subscribe(
      (state) => [
        state.workarea,
        // used in getWorkarea
        state['customized-dimension'],
        state.rotary_mode,
        // used in getAddOnInfo
        state.borderless,
        state['extend-rotary-workarea'],
        // used in getAddOnInfo
        state['pass-through'],
        state['pass-through-height'],
        // used in getAddOnInfo
        state['auto-feeder'],
        state['auto-feeder-height'],
      ],
      ([newWorkarea]) => {
        this.setWorkarea(newWorkarea as WorkAreaModel);
        this.resetView();
      },
      { equalityFn: shallow },
    );
  }

  setWorkarea(model: WorkAreaModel): void {
    const documentStore = useDocumentStore.getState();
    const isRotaryMode = documentStore.rotary_mode;
    const rotaryExtended = isRotaryMode && documentStore['extend-rotary-workarea'];
    const addOnInfo = getAddOnInfo(model);
    const passThroughMode = getPassThrough(addOnInfo);
    const autoFeeder = getAutoFeeder(addOnInfo);
    const workarea = getWorkarea(model);
    const modelChanged = this.model !== model;

    this.model = model;
    this.width = workarea.pxWidth;
    this.height = workarea.pxDisplayHeight ?? workarea.pxHeight;
    this.modelHeight = this.height;
    this.expansion = [0, 0];
    this.expansionType = undefined;

    const { dpmm } = constant;

    if (rotaryExtended && rotaryConstants[model]) {
      const { boundary, maxHeight } = rotaryConstants[model]!;
      const [, upperBound] = boundary ? [boundary[0] * dpmm, boundary[1] * dpmm] : [0, this.height];
      const pxMaxHeight = maxHeight * dpmm;

      // currently only extend in positive direction
      // this.expansion = [pxMaxHeight - lowerBound, pxMaxHeight - (this.height - upperBound)];
      this.expansion = [0, pxMaxHeight - (this.height - upperBound)];
      this.height += this.expansion[1];
      this.expansionType = ExpansionType.ROTARY;
    } else if (passThroughMode) {
      const passThroughHeight = documentStore['pass-through-height'];

      if (passThroughHeight && passThroughHeight * dpmm > this.height) {
        const expansion = passThroughHeight * dpmm - this.height;

        this.expansion = [0, expansion];
        this.height += expansion;
        this.expansionType = ExpansionType.PASS_THROUGH;
      }
    } else if (autoFeeder) {
      const autoFeederHeight = documentStore['auto-feeder-height'];

      if (autoFeederHeight && autoFeederHeight * dpmm > this.height) {
        const expansion = autoFeederHeight * dpmm - this.height;

        this.expansion = [0, expansion];
        this.height += expansion;
        this.expansionType = ExpansionType.AUTO_FEEDER;
      }
    } else if (workarea.topExpansion && !isRotaryMode) {
      this.expansion = [workarea.topExpansion, 0];
      this.height += workarea.topExpansion;
      this.expansionType = ExpansionType.MODULE;
    }

    this.minY = -this.expansion[0];
    this.maxY = this.height - this.expansion[0];
    this.boundary.maxY = this.maxY;
    this.boundary.minY = this.minY;
    this.boundary.maxX = this.width;
    this.boundary.minX = 0;

    const svgcontent = document.getElementById('svgcontent');
    const fixedSizeSvg = document.getElementById('fixedSizeSvg');
    const previewSvg = document.getElementById('previewSvg');
    const viewBox = `0 0 ${this.width} ${this.height}`;

    svgcontent?.setAttribute('viewBox', viewBox);
    fixedSizeSvg?.setAttribute('viewBox', viewBox);
    previewSvg?.setAttribute('viewBox', `0 0 ${this.width} ${this.modelHeight}`);
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
    const x = (this.width * targetZoom * expansionRatio).toString();
    const y = (this.height * targetZoom * expansionRatio).toString();
    const strW = w.toString();
    const strH = h.toString();
    const modelH = (this.modelHeight * targetZoom).toString();

    svgroot.setAttribute('x', x);
    svgroot.setAttribute('y', y);
    svgroot.setAttribute('width', rootW.toString());
    svgroot.setAttribute('height', rootH.toString());

    if (svgCanvas && workareaElem) {
      svgCanvas.style.width = `${Math.max(workareaElem.clientWidth, rootW)}px`;
      svgCanvas.style.height = `${Math.max(workareaElem.clientHeight, rootH)}px`;
    }

    const canvasBackground = document.getElementById('canvasBackground');

    if (canvasBackground) {
      canvasBackground.setAttribute('x', x);
      canvasBackground.setAttribute('y', y);
      canvasBackground.setAttribute('width', strW);
      canvasBackground.setAttribute('height', strH);
    }

    const canvasBackgroundRect = document.getElementById('canvasBackgroundRect');
    const yOffset = this.minY * targetZoom * expansionRatio;

    canvasBackgroundRect?.setAttribute('y', yOffset.toString());

    const previewSvg = document.getElementById('previewSvg');

    if (previewSvg) {
      previewSvg.setAttribute('width', strW);
      previewSvg.setAttribute('height', modelH);
    }

    const svgcontent = document.getElementById('svgcontent');

    if (svgcontent) {
      svgcontent.setAttribute('x', x);
      svgcontent.setAttribute('y', y);
      svgcontent.setAttribute('width', strW);
      svgcontent.setAttribute('height', strH);
    }

    if (workareaElem) {
      staticPoint = staticPoint ?? { x: workareaElem.clientWidth / 2, y: workareaElem.clientHeight / 2 };

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
    const container = document.getElementById('workarea-container');
    const background = document.getElementById('canvasBackground');

    if (!container || !background || !workArea) {
      setTimeout(() => this.resetView(), 100);

      return;
    }

    const { height, minY, width } = this;
    const hasRulers = useGlobalPreferenceStore.getState().show_rulers;
    const containerWidth = container.clientWidth - (hasRulers ? layoutConstants.rulerWidth : 0);
    const containerHeight = container.clientHeight - (hasRulers ? layoutConstants.rulerWidth : 0);
    const workareaToDimensionRatio = Math.min(containerWidth / width, containerHeight / height);
    const zoomLevel = workareaToDimensionRatio * 0.95;
    const workAreaWidth = width * zoomLevel;
    const workAreaHeight = height * zoomLevel;
    const offsetX = (containerWidth - workAreaWidth) / 2 + (hasRulers ? layoutConstants.rulerWidth : 0);
    const offsetY = (containerHeight - workAreaHeight) / 2 + (hasRulers ? layoutConstants.rulerWidth : 0);

    if (zoomLevel <= 0) {
      return;
    }

    this.zoom(zoomLevel);

    if (background && workArea) {
      const x = Number.parseFloat(background.getAttribute('x') ?? '0');
      const y = Number.parseFloat(background.getAttribute('y') ?? '0');
      const defaultScroll = {
        x: (x - offsetX) / zoomLevel,
        y: (y - offsetY) / zoomLevel + minY,
      };

      workArea.scrollLeft = defaultScroll.x * zoomLevel;
      workArea.scrollTop = defaultScroll.y * zoomLevel;
    }
  };
}

// singleton
const workareaManager = new WorkareaManager();

export default workareaManager;
