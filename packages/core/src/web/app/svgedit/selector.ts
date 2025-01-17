/* eslint-disable max-classes-per-file */
/**
 * Package: svedit.select
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 * Copyright(c) 2010 Jeff Schiller
 */
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import storage from 'implementations/storage';
import units from 'helpers/units';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { isMobile } from 'helpers/system-helper';

import workareaManager from './workarea';
import { getRotationAngle } from './transform/rotation';

const { svgedit } = window;

if (!svgedit.select) {
  svgedit.select = {};
}
const { NS } = svgedit;

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});
const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

let svgFactory;
let config;
const gripRadius = svgedit.browser.isTouch() ? 8 : 4;
const btnRadius = 12;
const btnMargin = 6; // for shadow
const btnPadding = 1;
const iconWidth = 2 * (btnRadius - btnPadding);
const rectDist = 25;
const SELECTOR_MAP_RESERVE_SIZE = 5;

const init = (injectedConfig, injectedSvgFactory): void => {
  config = injectedConfig;
  svgFactory = injectedSvgFactory;
};

/**
 * Class: svgedit.select.Selector
 * Private class for DOM element selection boxes
 */
class Selector {
  public elem: Element;

  public inUse: boolean;

  public selectorGroup: SVGGElement;

  private selectorRect: SVGPathElement;

  private gripsGroup: SVGGElement;

  private resizeGrips: {
    n?: SVGCircleElement;
    s?: SVGCircleElement;
    w?: SVGCircleElement;
    e?: SVGCircleElement;
    nw?: SVGCircleElement;
    ne?: SVGCircleElement;
    sw?: SVGCircleElement;
    se?: SVGCircleElement;
  };

  private rotateGripConnector: SVGLineElement;

  private rotateGripTop: SVGCircleElement;

  private rotateGripBottom: SVGGElement;

  private dimensionBG: SVGRectElement;

  private dimensionInfo: SVGTextElement;

  private dimension: {
    angle: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };

  private isShowing: boolean;

  /**
   *
   * @param elem DOM element associated with this selector
   * @param bbox Optional bbox to use for initialization (prevents duplicate getBBox call).
   */
  constructor(elem: Element, bbox?: BBox) {
    this.elem = elem;

    this.selectorGroup = svgFactory.createSVGElement({
      element: 'g',
      attr: { id: `selectorGroup_${elem.id}` },
    });
    this.selectorRect = svgFactory.createSVGElement({
      element: 'path',
      attr: {
        id: `selectedBox_${elem.id}`,
        fill: 'none',
        stroke: '#0000FF',
        'stroke-width': '1',
        'stroke-dasharray': '5,5',
        // need to specify this so that the rect is not selectable
        style: 'pointer-events:none',
      },
    });
    this.selectorGroup.appendChild(this.selectorRect);

    this.reset(elem, bbox);
  }

  generateGripGroup() {
    this.gripsGroup = document.createElementNS(NS.SVG, 'g') as unknown as SVGGElement;
    // this.selectorParentGroup.appendChild(this.gripsGroup);
    this.resizeGrips = {
      n: null,
      s: null,
      w: null,
      e: null,
      nw: null,
      ne: null,
      sw: null,
      se: null,
    };

    const dirs = Object.keys(this.resizeGrips);
    for (let i = 0; i < dirs.length; i += 1) {
      const dir = dirs[i];
      const grip = document.createElementNS(NS.SVG, 'circle') as unknown as SVGCircleElement;
      grip.setAttribute('id', `selectorGrip_resize_${dir}`);
      grip.setAttribute('r', gripRadius.toString());
      grip.setAttribute('fill', '#fff');
      grip.setAttribute('stroke', '#000');
      grip.setAttribute('stroke-width', '2');
      grip.setAttribute('style', `cursor:${dir}-resize`);
      grip.setAttribute('pointer-events', 'all');

      // jQuery Data for svgCanvas mouse event
      $.data(grip, 'dir', dir);
      $.data(grip, 'type', 'resize');

      this.gripsGroup.appendChild(grip);
      this.resizeGrips[dir] = grip;
    }

    this.rotateGripConnector = document.createElementNS(
      NS.SVG,
      'line'
    ) as unknown as SVGLineElement;
    this.rotateGripConnector.setAttribute('id', 'selectorGrip_rotateconnector');
    this.rotateGripConnector.setAttribute('stroke', '#0000FF');
    this.rotateGripConnector.setAttribute('stroke-width', '1');
    this.rotateGripConnector.setAttribute('class', 'hidden-mobile');
    this.gripsGroup.appendChild(this.rotateGripConnector);

    this.rotateGripTop = document.createElementNS(NS.SVG, 'circle') as unknown as SVGCircleElement;
    this.rotateGripTop.setAttribute('id', 'selectorGrip_rotate');
    this.rotateGripTop.setAttribute('r', gripRadius.toString());
    this.rotateGripTop.setAttribute('fill', '#12B700');
    this.rotateGripTop.setAttribute('stroke', '#0000FF');
    this.rotateGripTop.setAttribute('stroke-width', '2');
    this.rotateGripTop.setAttribute(
      'style',
      `cursor:url(${config.imgPath}rotate.png) 12 12, auto;`
    );
    this.rotateGripTop.setAttribute('class', 'hidden-mobile');
    this.gripsGroup.appendChild(this.rotateGripTop);
    $.data(this.rotateGripTop, 'type', 'rotate');
    this.rotateGripTop.setAttribute('data-angleOffset', '90');

    this.rotateGripBottom = document.createElementNS(NS.SVG, 'g') as unknown as SVGGElement;
    this.rotateGripBottom.setAttribute('id', 'selectorGrip_rotate_bottom');
    this.rotateGripBottom.innerHTML = `<g xmlns="http://www.w3.org/2000/svg" filter="url(#filter0_d_93_1829)">
      <circle cx="${btnRadius + btnMargin}" cy="${btnRadius}" r="${btnRadius}" fill="white"/>
      <image href="img/icon-rotate.svg" x="${btnPadding + btnMargin}" y="${btnPadding}"
        width="${iconWidth}" height="${iconWidth}"/>
      </g>
      <defs xmlns="http://www.w3.org/2000/svg">
      <filter id="filter0_d_93_1829" x="0" y="0" width="${2 * (btnRadius + btnMargin)}" height="30"
        filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="4"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_93_1829"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_93_1829" result="shape"/>
      </filter>
      </defs>`;
    this.rotateGripBottom.setAttribute('class', 'hidden-desktop');
    this.gripsGroup.appendChild(this.rotateGripBottom);
    const rotBtn = this.rotateGripBottom.querySelector('circle');
    $.data(rotBtn, 'type', 'rotate');
    rotBtn.setAttribute('data-angleOffset', '-90');
    const rotIcon = this.rotateGripBottom.querySelector('image');
    $.data(rotIcon, 'type', 'rotate');
    rotIcon.setAttribute('data-angleOffset', '-90');

    this.dimensionBG = document.createElementNS(NS.SVG, 'rect') as unknown as SVGRectElement;
    this.dimensionBG.setAttribute('id', 'selectorGrip_dimension_bg');
    this.dimensionBG.setAttribute('rx', '6');
    this.dimensionBG.setAttribute('fill', 'black');
    this.dimensionBG.setAttribute('class', 'hidden-desktop');
    this.gripsGroup.appendChild(this.dimensionBG);

    this.dimensionInfo = document.createElementNS(NS.SVG, 'text') as unknown as SVGTextElement;
    this.dimensionInfo.setAttribute('id', 'selectorGrip_dimension_info');
    this.dimensionInfo.setAttribute('text-anchor', 'middle');
    this.dimensionInfo.setAttribute('dominant-baseline', 'middle');
    this.dimensionInfo.setAttribute('fill', 'white');
    this.dimensionInfo.setAttribute('class', 'hidden-desktop');
    this.gripsGroup.appendChild(this.dimensionInfo);
  }

  reset(elem: Element, bbox?: BBox) {
    this.inUse = true;
    this.elem = elem;
    this.calculateDimesion(bbox);
    this.selectorRect.setAttribute('id', `selectedBox_${elem.id}`);
    this.selectorGroup.setAttribute('id', `selectorGroup_${elem.id}`);
  }

  resize(bbox?: BBox) {
    if (!this.isShowing) return;
    this.calculateDimesion(bbox);
    this.applyDimensions();
  }

  /**
   * Calculate the selector to match the element's size
   * @param bbox Optional bbox to use for resize (prevents duplicate getBBox call).
   */
  calculateDimesion(bbox?: BBox) {
    const { elem } = this;
    const strokeWidth = Number(elem.getAttribute('stroke-width'));
    const currentZoom = workareaManager.zoomRatio;
    const { tagName } = elem;
    // Offset between element and select rect
    let offset = tagName === 'text' ? 3 : 1;
    if (elem.getAttribute('stroke') !== 'none' && !Number.isNaN(strokeWidth)) {
      offset += (strokeWidth / 2) * currentZoom;
    }

    const tlist = svgedit.transformlist.getTransformList(elem);
    let m = svgedit.math.transformListToTransform(tlist).matrix;

    // This should probably be handled somewhere else, but for now
    // it keeps the selection box correctly positioned when zoomed
    m.e *= currentZoom;
    m.f *= currentZoom;

    let elemBBox = bbox || svgedit.utilities.getBBox(elem);
    if (tagName === 'g' && !$.data(elem, 'gsvg')) {
      // The bbox for a group does not include stroke vals, so we
      // get the bbox based on its children.
      const strokedBBox = svgFactory.getStrokedBBox(elem.childNodes);
      if (strokedBBox) {
        elemBBox = strokedBBox;
      }
    }
    if (!elemBBox) {
      // eslint-disable-next-line no-console
      console.warn('Selector Resize without bbox', elem, elemBBox);
      this.dimension = null;
      return;
    }

    const { x, y, width, height } = elemBBox;

    let transformedBBox = svgedit.math.transformBox(
      x * currentZoom,
      y * currentZoom,
      width * currentZoom,
      height * currentZoom,
      m
    );
    let { aabox } = transformedBBox;

    const angle = getRotationAngle(elem as SVGElement);
    if (angle) {
      const cx = aabox.x + aabox.width / 2;
      const cy = aabox.y + aabox.height / 2;
      // now if the shape is rotated, un-rotate it
      const rot = svgFactory.svgRoot().createSVGTransform();
      rot.setRotate(-angle, cx, cy);
      m = rot.matrix.multiply(m);
      transformedBBox = svgedit.math.transformBox(
        x * currentZoom,
        y * currentZoom,
        width * currentZoom,
        height * currentZoom,
        m
      );
      aabox = transformedBBox.aabox;
    }
    this.dimension = {
      x: aabox.x - offset,
      y: aabox.y - offset,
      width: aabox.width + 2 * offset,
      height: aabox.height + 2 * offset,
      angle,
    };
  }

  show(show: boolean, showGrips = true) {
    const { elem } = this;
    const display = show && elem ? 'inline' : 'none';
    this.selectorGroup.setAttribute('display', display);
    if (show && elem) {
      if (!this.gripsGroup) this.generateGripGroup();
      if (showGrips) {
        if (this.gripsGroup.parentNode !== this.selectorGroup) {
          this.selectorGroup.appendChild(this.gripsGroup);
        }
        this.applyDimensions();
      } else {
        this.gripsGroup.remove();
      }
      this.isShowing = true;
    } else if (this.gripsGroup) {
      this.gripsGroup.remove();
      this.isShowing = false;
    }
  }

  applyDimensions() {
    if (!this.dimension) return;
    const { x, y, width, height, angle } = this.dimension;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dStr = `M${x},${y}L${x + width},${y}L${x + width},${y + height}L${x},${y + height}z`;
    this.selectorRect.setAttribute('d', dStr);
    if (svgCanvas.getCurrentMode() === 'preview_color') {
      this.gripsGroup.setAttribute('display', 'none');
      return;
    }
    this.gripsGroup.removeAttribute('display');
    const xform = angle ? `rotate(${angle} ${cx} ${cy})` : '';
    this.selectorGroup.setAttribute('transform', xform);

    const positionMap = {
      n: [cx, y],
      s: [cx, y + height],
      w: [x, cy],
      e: [x + width, cy],
      nw: [x, y],
      ne: [x + width, y],
      sw: [x, y + height],
      se: [x + width, y + height],
    };
    const dirs = Object.keys(positionMap);
    for (let i = 0; i < dirs.length; i += 1) {
      const dir = dirs[i];
      this.resizeGrips[dir].setAttribute('cx', positionMap[dir][0].toString());
      this.resizeGrips[dir].setAttribute('cy', positionMap[dir][1].toString());
    }
    if (isMobile()) {
      const rotX = cx - btnRadius - btnMargin;
      const rotY = y + height + 2 * gripRadius;
      this.rotateGripBottom.setAttribute(
        'transform',
        `translate(${rotX} ${rotY}) rotate(${-angle} ${btnRadius + btnMargin} ${btnRadius})`
      );
      this.updateDimensionInfo();
    } else {
      this.rotateGripConnector.setAttribute('x1', cx.toString());
      this.rotateGripConnector.setAttribute('x2', cx.toString());
      this.rotateGripConnector.setAttribute('y1', y.toString());
      this.rotateGripConnector.setAttribute('y2', (y - 5 * gripRadius).toString());
      this.rotateGripTop.setAttribute('cx', cx.toString());
      this.rotateGripTop.setAttribute('cy', (y - 5 * gripRadius).toString());
      this.updateGripCursors();
    }
  }

  updateDimensionInfo() {
    const { x, y, width, height, angle } = this.dimension;
    const elemDimension = ObjectPanelController.getDimensionValues();
    let newContent = '';
    if (svgCanvas.getCurrentMode() === 'rotate') {
      const elemAngle = +angle.toFixed(1);
      newContent = `${elemAngle}&deg;`;
    } else {
      const useInch = storage.get('default-units') === 'inches';
      const unit = useInch ? 'inch' : 'mm';
      const elemW = +units
        .convertUnit(elemDimension.width / 10 || elemDimension.rx / 5, unit, 'mm')
        .toFixed(1);
      const elemH = +units
        .convertUnit(elemDimension.height / 10 || elemDimension.ry / 5, unit, 'mm')
        .toFixed(1);
      if (![elemW, elemH].includes(NaN)) newContent = `${elemW}${unit} x ${elemH}${unit}`;
    }
    this.dimensionInfo.innerHTML = newContent;
    if (newContent) {
      const cx = x + width / 2;
      const cy = y + height / 2;
      let step = Math.round(angle / 90);
      if (step < 0) step += 4;
      let rectCx = cx;
      let rectCy = y - rectDist;
      let rotate = 0;
      const textBBox = svgedit.utilities.getBBox(this.dimensionInfo);
      const rectW = textBBox.width + 30;
      const rectH = textBBox.height + 10;
      switch (step) {
        case 1:
          rectCx = x - rectDist;
          rectCy = cy;
          rotate = 270;
          break;
        case 2:
          rectCx = cx;
          rectCy = y + height + 2 * gripRadius + 2 * btnRadius + rectDist;
          rotate = 180;
          break;
        case 3:
          rectCx = x + width + rectDist;
          rectCy = cy;
          rotate = 90;
          break;
        default:
          break;
      }
      this.dimensionInfo.setAttribute('x', rectCx.toString());
      this.dimensionInfo.setAttribute('y', rectCy.toString());
      this.dimensionInfo.setAttribute('transform', `rotate(${rotate} ${rectCx} ${rectCy})`);
      this.dimensionBG.setAttribute('x', (rectCx - rectW / 2).toString());
      this.dimensionBG.setAttribute('y', (rectCy - rectH / 2).toString());
      this.dimensionBG.setAttribute('width', rectW.toString());
      this.dimensionBG.setAttribute('height', rectH.toString());
      this.dimensionBG.setAttribute('transform', `rotate(${rotate} ${rectCx} ${rectCy})`);
    } else {
      this.dimensionBG.setAttribute('width', '0');
    }
  }

  updateGripCursors() {
    const { angle } = this.dimension;
    let step = Math.round(angle / 45);
    if (step < 0) step += 8;
    const directionMap = {
      nw: 0,
      n: 1,
      ne: 2,
      e: 3,
      se: 4,
      s: 5,
      sw: 6,
      w: 7,
    };
    const cursorMap = {
      0: 'nwse',
      1: 'ns',
      2: 'nesw',
      3: 'ew',
    };
    const dirs = Object.keys(this.resizeGrips);
    for (let i = 0; i < dirs.length; i += 1) {
      const dir = dirs[i];
      const cursorDir = cursorMap[(directionMap[dir] + step) % 4];
      this.resizeGrips[dir].setAttribute('style', `cursor:${cursorDir}-resize`);
    }
  }

  cleanUp() {
    this.selectorGroup.remove();
  }
}

svgedit.select.Selector = Selector;

export class SelectorManager {
  public selectorParentGroup: SVGGElement;

  private rubberBandBox: SVGRectElement;

  private selectorMap: { [id: string]: Selector };

  constructor() {
    this.initGroup();
  }

  initGroup(): void {
    if (this.selectorParentGroup) {
      this.selectorParentGroup.remove();
    }
    this.selectorParentGroup = document.createElementNS(NS.SVG, 'g') as unknown as SVGGElement;
    this.selectorParentGroup.setAttribute('id', 'selectorParentGroup');

    svgFactory.svgRoot().appendChild(this.selectorParentGroup);

    this.selectorMap = {};
    this.rubberBandBox?.remove();
    this.rubberBandBox = null;

    canvasEventEmitter.on('zoom-changed', () => {
      requestAnimationFrame(() => this.handleZoomChange());
    });
  }

  handleZoomChange(): void {
    const svgcontent = document.getElementById('svgcontent');
    const x = svgcontent.getAttribute('x');
    const y = svgcontent.getAttribute('y');
    this.selectorParentGroup.setAttribute('transform', `translate(${x},${y})`);

    const selectors = Object.values(this.selectorMap);
    selectors.forEach((selector) => {
      if (selector.inUse) selector.resize();
    });
  }


  resizeSelectors(elems: Element[]): void {
    for (let i = 0; i < elems.length; i += 1) {
      const elem = elems[i];
      if (this.selectorMap[elem.id] && this.selectorMap[elem.id].inUse) {
        this.selectorMap[elem.id].resize();
      }
    }
  }

  requestSelector(elem: Element, bbox?: BBox): Selector {
    if (!elem) return null;
    if (this.selectorMap[elem.id] && this.selectorMap[elem.id].inUse) {
      return this.selectorMap[elem.id];
    }
    const ids = Object.keys(this.selectorMap);
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const selector = this.selectorMap[id];
      if (!selector.inUse) {
        delete this.selectorMap[id];
        selector.reset(elem, bbox);
        selector.show(true);
        this.selectorMap[elem.id] = selector;
        return selector;
      }
    }
    const selector = new Selector(elem, bbox);
    this.selectorParentGroup.appendChild(selector.selectorGroup);
    this.selectorMap[elem.id] = selector;
    return selector;
  }

  releaseSelector(elem: Element): void {
    if (!elem) return;
    const selector = this.selectorMap[elem.id];
    if (selector && selector.inUse) {
      const selectorMapSize = Object.keys(this.selectorMap).length;
      if (selectorMapSize <= SELECTOR_MAP_RESERVE_SIZE) {
        selector.inUse = false;
        selector.elem = null;
        selector.show(false);
      } else {
        delete this.selectorMap[elem.id];
        selector.cleanUp();
      }
    }
  }

  getRubberBandBox() {
    if (!this.rubberBandBox) {
      this.rubberBandBox = document.createElementNS(NS.SVG, 'rect') as unknown as SVGRectElement;
      this.rubberBandBox.setAttribute('id', 'selectorRubberBand');
      this.rubberBandBox.setAttribute('stroke', '#0000FF');
      this.rubberBandBox.setAttribute('stroke-width', '0.5');
      this.rubberBandBox.setAttribute('fill', '#0000FF');
      this.rubberBandBox.setAttribute('fill-opacity', '0.15');
      this.rubberBandBox.setAttribute('display', 'none');
      this.rubberBandBox.setAttribute(
        'style',
        'pointer-events:none;will-change: transform, x, y, width, height, scroll-position;'
      );
      this.selectorParentGroup.appendChild(this.rubberBandBox);
    }
    return this.rubberBandBox;
  }
}

svgedit.select.SelectorManager = SelectorManager;

let selectorManagerSingleton: SelectorManager;
const getSelectorManager = (): SelectorManager => {
  if (!selectorManagerSingleton) {
    selectorManagerSingleton = new SelectorManager();
  }
  return selectorManagerSingleton;
};
svgedit.select.getSelectorManager = getSelectorManager;

export default {
  init,
  getSelectorManager,
};
