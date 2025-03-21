import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export class AddOnBoundaryDrawer {
  private static instance: AddOnBoundaryDrawer;

  private container?: SVGSVGElement;
  private autoFeederPath?: SVGPathElement;
  private passThroughPath?: SVGPathElement;
  private openBottomRect?: SVGRectElement;

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

    beamboxPreferenceEvents.on('auto-feeder', this.updateAutoFeederPath);
    beamboxPreferenceEvents.on('borderless', this.update);
    beamboxPreferenceEvents.on('pass-through', this.updatePassThroughPath);
    canvasEventEmitter.on('canvas-change', this.update);
  }

  unregisterEvents(): void {
    const beamboxPreferenceEvents = eventEmitterFactory.createEventEmitter('beambox-preference');
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    beamboxPreferenceEvents.off('auto-feeder', this.updateAutoFeederPath);
    beamboxPreferenceEvents.off('borderless', this.update);
    beamboxPreferenceEvents.off('pass-through', this.updatePassThroughPath);
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

      const generateElement = <T extends SVGElement>(tagName = 'path') => {
        const elem = document.createElementNS(NS.SVG, tagName) as T;

        elem.setAttribute('fill', '#CCC');
        elem.setAttribute('fill-opacity', '0.4');
        elem.setAttribute('fill-rule', 'evenodd');
        elem.setAttribute('stroke', 'none');
        elem.setAttribute('style', 'pointer-events:none');
        this.container!.appendChild(elem);

        return elem;
      };

      this.autoFeederPath = generateElement();
      this.passThroughPath = generateElement();
      this.openBottomRect = generateElement('rect');
      this.openBottomRect.id = 'open-bottom-boundary';
      this.openBottomRect.setAttribute('y', '0');
      this.openBottomRect.setAttribute('height', '100%');
      canvasBackground.appendChild(this.container);
    }
  }

  updateContainerSize = (): void => {
    const { height, width } = workareaManager;
    const viewBox = `0 0 ${width} ${height}`;

    this.container?.setAttribute('viewBox', viewBox);
  };

  updateAutoFeederPath = (): void => {
    const { height: workareaH, model, width: workareaW } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const { autoFeeder } = addOnInfo;

    if (!getAutoFeeder(addOnInfo) || !autoFeeder?.xRange) {
      this.autoFeederPath?.setAttribute('d', '');

      return;
    }

    let [x, width] = autoFeeder.xRange!;
    const { dpmm } = constant;

    x *= dpmm;
    width *= dpmm;
    this.autoFeederPath?.setAttribute(
      'd',
      `M0 0 H${x} V${workareaH} H0 Z M${x + width} 0 H${workareaW} V${workareaH} H${x + width} Z`,
    );

    return;
  };

  updatePassThroughPath = (): void => {
    const { height: workareaH, model, width: workareaW } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const { passThrough } = addOnInfo;

    if (!getPassThrough(addOnInfo) || !passThrough?.xRange) {
      this.passThroughPath?.setAttribute('d', '');

      return;
    }

    let [x, width] = passThrough.xRange;
    const { dpmm } = constant;

    x *= dpmm;
    width *= dpmm;
    this.passThroughPath?.setAttribute(
      'd',
      `M0 0 H${x} V${workareaH} H0 Z M${x + width} 0 H${workareaW} V${workareaH} H${x + width} Z`,
    );

    return;
  };

  updateOpenBottomBoundary = (): void => {
    const enabled = beamboxPreference.read('borderless');
    const { model, width } = workareaManager;
    const { openBottom } = getAddOnInfo(model);

    if (!enabled || !openBottom) {
      this.openBottomRect?.setAttribute('display', 'none');

      return;
    }

    const w = constant.borderless.safeDistance.X * constant.dpmm;
    const x = width - w;

    this.openBottomRect?.setAttribute('x', x.toString());
    this.openBottomRect?.setAttribute('width', w.toString());
    this.openBottomRect?.removeAttribute('display');
  };

  update = (): void => {
    this.createElements();
    this.updateContainerSize();
    this.updateAutoFeederPath();
    this.updatePassThroughPath();
    this.updateOpenBottomBoundary();
  };
}

export const addOnBoundaryDrawer = AddOnBoundaryDrawer.getInstance();

export default addOnBoundaryDrawer;
