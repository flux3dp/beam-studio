import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import workareaManager from '@core/app/svgedit/workarea';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

export class AddOnBoundaryDrawer {
  private static instance: AddOnBoundaryDrawer;

  private container: SVGSVGElement;

  private appended = false;

  private boundary: {
    autoFeeder: SVGPathElement;
    openBottom: SVGRectElement;
    passThrough: SVGPathElement;
    uvPrint: SVGPathElement;
  };

  private constructor() {
    this.container = this.generateContainer();

    this.boundary = {
      autoFeeder: this.generateElement('path'),
      openBottom: this.generateElement('rect', 'open-bottom-boundary'),
      passThrough: this.generateElement('path'),
      uvPrint: this.generateElement('path'),
    };
  }

  static getInstance(): AddOnBoundaryDrawer {
    return (AddOnBoundaryDrawer.instance ??= new AddOnBoundaryDrawer());
  }

  registerEvents(): void {
    const beamboxPreferenceEvents = eventEmitterFactory.createEventEmitter('beambox-preference');
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    beamboxPreferenceEvents.on('auto-feeder', this.updateAutoFeederPath);
    beamboxPreferenceEvents.on('borderless', this.update);
    beamboxPreferenceEvents.on('pass-through', this.updatePassThroughPath);
    canvasEventEmitter.on('canvas-change', this.update);
    canvasEventEmitter.on('select-module-changed', this.updateUvPath);
  }

  unregisterEvents(): void {
    const beamboxPreferenceEvents = eventEmitterFactory.createEventEmitter('beambox-preference');
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    beamboxPreferenceEvents.off('auto-feeder', this.updateAutoFeederPath);
    beamboxPreferenceEvents.off('borderless', this.update);
    beamboxPreferenceEvents.off('pass-through', this.updatePassThroughPath);
    canvasEventEmitter.off('canvas-change', this.update);
    canvasEventEmitter.off('select-module-changed', this.updateUvPath);
  }

  private generateContainer = (): SVGSVGElement => {
    const container = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;

    container.setAttribute('id', 'add-on-boundary');
    container.setAttribute('x', '0');
    container.setAttribute('y', '0');
    container.setAttribute('width', '100%');
    container.setAttribute('height', '100%');
    container.setAttribute('style', 'pointer-events:none');

    return container;
  };

  private generateElement = <T extends SVGElement>(tagName = 'path', id?: string) => {
    const elem = document.createElementNS(NS.SVG, tagName) as T;

    if (id) elem.id = id;

    elem.setAttribute('fill', '#CCC');
    elem.setAttribute('fill-opacity', '0.4');
    elem.setAttribute('fill-rule', 'evenodd');
    elem.setAttribute('stroke', 'none');
    elem.setAttribute('style', 'pointer-events:none');

    if (tagName === 'rect') {
      elem.setAttribute('y', '0');
      elem.setAttribute('height', '100%');
    }

    this.container.appendChild(elem);

    return elem;
  };

  private appendToCanvasBackground = (): void => {
    if (this.appended) return;

    const canvasBackground = document.getElementById('canvasBackground');

    if (canvasBackground && !canvasBackground.contains(this.container)) {
      canvasBackground.append(this.container);
      this.appended = true;
    }
  };

  private updateContainerSize = (): void => {
    const { height, width } = workareaManager;
    const viewBox = `0 0 ${width} ${height}`;

    this.container.setAttribute('viewBox', viewBox);
  };

  updateAutoFeederPath = (): void => {
    const { height: workareaH, model, width: workareaW } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const { autoFeeder } = addOnInfo;

    if (!getAutoFeeder(addOnInfo) || !autoFeeder?.xRange) {
      this.boundary.autoFeeder.setAttribute('d', '');

      return;
    }

    let [x, width] = autoFeeder.xRange!;
    const { dpmm } = constant;

    x *= dpmm;
    width *= dpmm;
    this.boundary.autoFeeder.setAttribute(
      'd',
      `M0 0 H${x} V${workareaH} H0 Z M${x + width} 0 H${workareaW} V${workareaH} H${x + width} Z`,
    );

    return;
  };

  updatePassThroughPath = (): void => {
    const { expansion, height: workareaH, model, width: workareaW } = workareaManager;
    const addOnInfo = getAddOnInfo(model);
    const { passThrough } = addOnInfo;

    if (!getPassThrough(addOnInfo)) {
      this.boundary.passThrough.setAttribute('d', '');

      return;
    }

    let [x, width] = [0, workareaW];

    if (passThrough?.xRange) {
      const { dpmm } = constant;

      [x, width] = passThrough.xRange;
      x *= dpmm;
      width *= dpmm;
    }

    this.boundary.passThrough.setAttribute(
      'd',
      `M0 0 H${workareaW} V${workareaH} H0 Z M${x} ${expansion[0]} H${x + width} V${workareaH - expansion[1]} H${x} Z`,
    );

    return;
  };

  updateOpenBottomBoundary = (): void => {
    const enabled = beamboxPreference.read('borderless');
    const { model, width } = workareaManager;
    const { openBottom } = getAddOnInfo(model);

    if (!enabled || !openBottom) {
      this.boundary.openBottom.setAttribute('display', 'none');

      return;
    }

    const w = constant.borderless.safeDistance.X * constant.dpmm;
    const x = width - w;

    this.boundary.openBottom.setAttribute('x', x.toString());
    this.boundary.openBottom.setAttribute('width', w.toString());
    this.boundary.openBottom.removeAttribute('display');
  };

  updateUvPath = (module: LayerModule): void => {
    const { height, model, width } = workareaManager;
    const { dpmm } = constant;

    if (module !== LayerModule.UV_PRINT || promarkModels.has(model)) {
      this.boundary.uvPrint.setAttribute('d', '');
      this.container.setAttribute('display', 'none');

      return;
    }

    this.container.removeAttribute('display');

    // A4 paper size: 297mm x 210mm
    const x = 297 * dpmm;
    const y = 210 * dpmm;

    this.boundary.uvPrint.setAttribute('d', `M${width},${height}H0,V${y}H${x}V0H${width}V${height}`);
  };

  update = (): void => {
    this.appendToCanvasBackground();
    this.updateContainerSize();
    this.updateAutoFeederPath();
    this.updatePassThroughPath();
    this.updateOpenBottomBoundary();
  };
}

export const addOnBoundaryDrawer = AddOnBoundaryDrawer.getInstance();
