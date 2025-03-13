import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import { getSupportInfo } from '@core/app/constants/add-on';
import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export class AddOnBoundaryDrawer {
  private static instance: AddOnBoundaryDrawer;

  private container?: SVGSVGElement;
  private autoFeederPath?: SVGPathElement;
  private passThroughPath?: SVGPathElement;

  private constructor() {}

  static getInstance(): AddOnBoundaryDrawer {
    if (!AddOnBoundaryDrawer.instance) {
      AddOnBoundaryDrawer.instance = new AddOnBoundaryDrawer();
    }

    return AddOnBoundaryDrawer.instance;
  }

  registerEvents(): void {
    const beamboxPreferenceEvents = eventEmitterFactory.createEventEmitter('beambox-preference');
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    beamboxPreferenceEvents.on('auto-feeder', this.update);
    canvasEventEmitter.on('canvas-change', this.update);
  }

  unregisterEvents(): void {
    const beamboxPreferenceEvents = eventEmitterFactory.createEventEmitter('beambox-preference');
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    beamboxPreferenceEvents.off('auto-feeder', this.update);
    canvasEventEmitter.off('canvas-change', this.update);
  }

  private createElements(): void {
    if (!this.container) {
      const canvasBackground = document.getElementById('canvasBackground');

      if (!canvasBackground) return;

      this.container = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
      this.container.setAttribute('id', 'add-on-boundary');
      this.container.setAttribute('x', '0');
      this.container.setAttribute('y', '0');
      this.container.setAttribute('width', '100%');
      this.container.setAttribute('height', '100%');
      this.container.setAttribute('style', 'pointer-events:none');

      const generatePath = () => {
        const path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;

        path.setAttribute('fill', '#CCC');
        path.setAttribute('fill-opacity', '0.4');
        path.setAttribute('fill-rule', 'evenodd');
        path.setAttribute('stroke', 'none');
        path.setAttribute('style', 'pointer-events:none');
        this.container!.appendChild(path);

        return path;
      };

      this.autoFeederPath = generatePath();
      this.passThroughPath = generatePath();
      canvasBackground.appendChild(this.container);
    }
  }

  updateContainerSize = (): void => {
    const { height, width } = workareaManager;
    const viewBox = `0 0 ${width} ${height}`;

    this.container?.setAttribute('viewBox', viewBox);
  };

  updateAutoFeederPath = (): boolean => {
    const enabled = beamboxPreference.read('auto-feeder');
    const { height: workareaH, model, width: workareaW } = workareaManager;
    const { autoFeeder } = getSupportInfo(model);

    if (!enabled || !autoFeeder?.xRange) {
      this.autoFeederPath?.setAttribute('d', '');

      return false;
    }

    let [x, width] = autoFeeder.xRange;
    const { dpmm } = constant;

    x *= dpmm;
    width *= dpmm;
    this.autoFeederPath?.setAttribute(
      'd',
      `M0 0 H${x} V${workareaH} H0 Z M${x + width} 0 H${workareaW} V${workareaH} H${x + width} Z`,
    );

    return true;
  };

  updatePassThroughPath = (): boolean => {
    const enabled = beamboxPreference.read('pass-through');
    const { height: workareaH, model, width: workareaW } = workareaManager;
    const { passThrough } = getSupportInfo(model);

    if (!enabled || !passThrough?.xRange) {
      this.passThroughPath?.setAttribute('d', '');

      return false;
    }

    let [x, width] = passThrough.xRange;
    const { dpmm } = constant;

    x *= dpmm;
    width *= dpmm;
    this.passThroughPath?.setAttribute(
      'd',
      `M0 0 H${x} V${workareaH} H0 Z M${x + width} 0 H${workareaW} V${workareaH} H${x + width} Z`,
    );

    return true;
  };

  update = (): void => {
    this.createElements();

    const hasAutoFeeder = this.updateAutoFeederPath();
    const hasPassThrough = this.updatePassThroughPath();

    if (hasAutoFeeder || hasPassThrough) {
      this.updateContainerSize();
      this.container?.removeAttribute('display');
    } else {
      this.container?.setAttribute('display', 'none');
    }
  };
}

export const addOnBoundaryDrawer = AddOnBoundaryDrawer.getInstance();

export default addOnBoundaryDrawer;
