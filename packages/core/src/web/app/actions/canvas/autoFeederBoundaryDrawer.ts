import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import { getSupportInfo } from '@core/app/constants/add-on';
import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export class AutoFeederBoundaryDrawer {
  private static instance: AutoFeederBoundaryDrawer;

  private container?: SVGSVGElement;
  private path?: SVGPathElement;

  private constructor() {}

  static getInstance(): AutoFeederBoundaryDrawer {
    if (!AutoFeederBoundaryDrawer.instance) {
      AutoFeederBoundaryDrawer.instance = new AutoFeederBoundaryDrawer();
    }

    return AutoFeederBoundaryDrawer.instance;
  }

  registerEvents(): void {
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    canvasEventEmitter.on('canvas-change', this.update);
  }

  unregisterEvents(): void {
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    canvasEventEmitter.off('canvas-change', this.update);
  }

  private createElements(): void {
    if (!this.container) {
      const canvasBackground = document.getElementById('canvasBackground');

      if (!canvasBackground) return;

      this.container = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
      this.container.setAttribute('id', 'auto-feeder-boundary');
      this.container.setAttribute('x', '0');
      this.container.setAttribute('y', '0');
      this.container.setAttribute('width', '100%');
      this.container.setAttribute('height', '100%');
      this.container.setAttribute('style', 'pointer-events:none');
      this.path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
      this.path.setAttribute('fill', '#CCC');
      this.path.setAttribute('fill-opacity', '0.4');
      this.path.setAttribute('fill-rule', 'evenodd');
      this.path.setAttribute('stroke', 'none');
      this.path.setAttribute('style', 'pointer-events:none');
      this.container.appendChild(this.path);
      canvasBackground.appendChild(this.container);
    }
  }

  updateContainerSize = (): void => {
    const { height, width } = workareaManager;
    const viewBox = `0 0 ${width} ${height}`;

    this.container?.setAttribute('viewBox', viewBox);
  };

  update = (): void => {
    this.createElements();

    const enabled = beamboxPreference.read('auto-feeder');
    const { height: workareaH, model, width: workareaW } = workareaManager;
    const { autoFeeder } = getSupportInfo(model);

    if (!enabled || !autoFeeder?.xRange) {
      this.path?.setAttribute('d', '');
      this.container?.setAttribute('display', 'none');

      return;
    }

    this.updateContainerSize();
    this.container?.removeAttribute('display');

    let [x, width] = autoFeeder.xRange;
    const { dpmm } = constant;

    x *= dpmm;
    width *= dpmm;
    this.path?.setAttribute(
      'd',
      `M0 0 H${x} V${workareaH} H0 Z M${x + width} 0 H${workareaW} V${workareaH} H${x + width} Z`,
    );
  };
}

export const autoFeederBoundaryDrawer = AutoFeederBoundaryDrawer.getInstance();

export default autoFeederBoundaryDrawer;
