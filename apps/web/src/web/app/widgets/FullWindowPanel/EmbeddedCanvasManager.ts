import eventEmitterFactory from 'helpers/eventEmitterFactory';
import NS from 'app/constants/namespaces';
import touchEvents from 'app/svgedit/touchEvents';
import wheelEventHandlerGenerator from 'app/svgedit/interaction/wheelEventHandler';
import workareaManager from 'app/svgedit/workarea';

import styles from './EmbeddedCanvas.module.scss';

const zoomBlockEventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

/**
 * Manages the embedded canvas view in the full window panel.
 */
export class EmbeddedCanvasManager {
  protected container: HTMLDivElement;
  protected root: SVGSVGElement;
  protected svgcontent: SVGSVGElement;
  protected background: SVGSVGElement;
  protected width: number;
  protected height: number;
  private canvasExpansion = 3; // extra space

  public zoomRatio = 1;

  static instance = null;

  static getInstance<T extends typeof EmbeddedCanvasManager>(this: T): InstanceType<T> {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  static clear(): void {
    this.instance?.root?.remove();
    this.instance = null;
  }

  /**
   * render function: put the canvas in the container and set up event listeners.
   * @param container The container to render the canvas in.
   */
  render = (container: HTMLDivElement): void => {
    this.setupContainer(container);
    this.renderContent();
    this.resetView();
    const wheelHandler = wheelEventHandlerGenerator(() => this.zoomRatio, this.zoom, {
      maxZoom: 10,
      getCenter: (e) => ({ x: e.layerX ?? e.clientX, y: e.layerY ?? e.clientY }),
    });
    this.container.addEventListener('wheel', wheelHandler);
    if (navigator.maxTouchPoints > 1) {
      touchEvents.setupCanvasTouchEvents(
        this.container,
        this.container,
        () => {},
        () => {},
        () => {},
        () => {},
        this.zoom
      );
    }
  };

  setupContainer = (container: HTMLDivElement): void => {
    this.width = workareaManager.width;
    this.height = workareaManager.height;
    this.container = container;
    this.root = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
    this.root.setAttribute('xlinkns', NS.XLINK);
    this.root.setAttribute('xmlns', NS.SVG);
    this.background = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
    const backgroundRect = document.createElementNS(NS.SVG, 'rect');
    backgroundRect.setAttribute('x', '0');
    backgroundRect.setAttribute('y', '0');
    backgroundRect.setAttribute('width', '100%');
    backgroundRect.setAttribute('height', '100%');
    backgroundRect.setAttribute('fill', '#fff');
    backgroundRect.setAttribute('stroke', '#000');
    backgroundRect.setAttribute('stroke-width', '1');
    backgroundRect.setAttribute('vector-effect', 'non-scaling-stroke');
    this.background.classList.add(styles.background);
    this.background.appendChild(backgroundRect);
    const canvasGrid = document.querySelector('#canvasGrid') as SVGSVGElement;
    if (canvasGrid) this.background.appendChild(canvasGrid.cloneNode(true));
    this.root.appendChild(this.background);
    this.container.appendChild(this.root);
  };

  protected setupContent = (): void => {
    this.svgcontent = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
    this.svgcontent.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svgcontent.setAttribute('xmlns', NS.SVG);
    this.svgcontent.setAttribute('xmlns:xlink', NS.XLINK);
    this.svgcontent.setAttribute('overflow', 'visible');
    this.root.appendChild(this.svgcontent);
  };

  protected renderContent = (): void => {
    this.setupContent();
  };

  zoom = (zoomRatio: number, staticPoint?: { x: number; y: number }): void => {
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
    this.root?.setAttribute('x', x.toString());
    this.root?.setAttribute('y', y.toString());
    this.root?.setAttribute('width', rootW.toString());
    this.root?.setAttribute('height', rootH.toString());

    this.background?.setAttribute('x', x.toString());
    this.background?.setAttribute('y', y.toString());
    this.background?.setAttribute('width', w.toString());
    this.background?.setAttribute('height', h.toString());

    this.svgcontent?.setAttribute('x', x.toString());
    this.svgcontent?.setAttribute('y', y.toString());
    this.svgcontent?.setAttribute('width', w.toString());
    this.svgcontent?.setAttribute('height', h.toString());

    // eslint-disable-next-line no-param-reassign
    staticPoint = staticPoint ?? {
      x: this.container.clientWidth / 2,
      y: this.container.clientHeight / 2,
    };
    const oldScroll = { x: this.container.scrollLeft, y: this.container.scrollTop };
    const zoomChanged = targetZoom / oldZoomRatio;
    this.container.scrollLeft = (oldScroll.x + staticPoint.x) * zoomChanged - staticPoint.x;
    this.container.scrollTop = (oldScroll.y + staticPoint.y) * zoomChanged - staticPoint.y;
    zoomBlockEventEmitter.emit('UPDATE_ZOOM_BLOCK');
  };

  zoomIn = (ratio = 1.1): void => {
    this.zoom(this.zoomRatio * ratio);
  };

  zoomOut = (ratio = 1.1): void => {
    this.zoom(this.zoomRatio / ratio);
  };

  resetView = (): void => {
    const { width, height } = this;
    const { clientWidth, clientHeight } = this.container;
    const workareaToDimensionRatio = Math.min(clientWidth / width, clientHeight / height);
    const zoomLevel = workareaToDimensionRatio * 0.95;
    const workAreaWidth = width * zoomLevel;
    const workAreaHeight = height * zoomLevel;
    const offsetX = (clientWidth - workAreaWidth) / 2;
    const offsetY = (clientHeight - workAreaHeight) / 2;
    this.zoom(zoomLevel);
    const x = parseFloat(this.background.getAttribute('x'));
    const y = parseFloat(this.background.getAttribute('y'));
    const defaultScroll = {
      x: (x - offsetX) / zoomLevel,
      y: (y - offsetY) / zoomLevel,
    };
    this.container.scrollLeft = defaultScroll.x * zoomLevel;
    this.container.scrollTop = defaultScroll.y * zoomLevel;
  };
}

export default EmbeddedCanvasManager;
