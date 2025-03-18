import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export class UvExportBoundaryDrawer {
  private static instance: UvExportBoundaryDrawer;

  private container?: SVGSVGElement;
  private path?: SVGPathElement;

  private constructor() {}

  static getInstance(): UvExportBoundaryDrawer {
    return (UvExportBoundaryDrawer.instance ??= new UvExportBoundaryDrawer());
  }

  registerEvents(): void {
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
    const layerStateEventEmitter = eventEmitterFactory.createEventEmitter('layer-state');

    canvasEventEmitter.on('canvas-change', this.update);
    canvasEventEmitter.on('model-changed', this.update);
    layerStateEventEmitter.on('uv-export-changed', this.update);
  }

  unregisterEvents(): void {
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
    const layerStateEventEmitter = eventEmitterFactory.createEventEmitter('layer-state');

    canvasEventEmitter.off('canvas-change', this.update);
    canvasEventEmitter.off('model-changed', this.update);
    layerStateEventEmitter.off('uv-export-changed', this.update);
  }

  private createElements(): void {
    const canvasBackground = document.getElementById('canvasBackground');

    if (this.container || !canvasBackground) return;

    this.container = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
    this.path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;

    this.container.setAttribute('id', 'uv-export-boundary');
    this.container.setAttribute('x', '0');
    this.container.setAttribute('y', '0');
    this.container.setAttribute('width', '100%');
    this.container.setAttribute('height', '100%');
    this.container.setAttribute('style', 'pointer-events:none');

    this.path.setAttribute('fill', '#CCC');
    this.path.setAttribute('fill-opacity', '0.4');
    this.path.setAttribute('fill-rule', 'evenodd');
    this.path.setAttribute('stroke', 'none');
    this.path.setAttribute('style', 'pointer-events:none');

    canvasBackground.appendChild(this.container);
    this.container.appendChild(this.path);
  }

  updateContainerSize = (): void => {
    const { height, width } = workareaManager;
    const viewBox = `0 0 ${width} ${height}`;

    this.container?.setAttribute('viewBox', viewBox);
  };

  update = (enabled: boolean): void => {
    const { height, model, width } = workareaManager;
    const { dpmm } = constant;

    this.createElements();

    if (!this.container || !this.path) return;

    if (!enabled || promarkModels.has(model)) {
      this.path.setAttribute('d', '');
      this.container.setAttribute('display', 'none');

      return;
    }

    this.updateContainerSize();
    this.container.removeAttribute('display');

    // 297mm x 210mm A4 paper size
    const x = 297 * dpmm;
    const y = 210 * dpmm;

    this.path.setAttribute('d', `M${width},${height}H0,V${y}H${x}V0H${width}V${height}`);
  };
}

export const uvExportBoundaryDrawer = UvExportBoundaryDrawer.getInstance();
