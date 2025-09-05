import { shallow } from 'zustand/shallow';

import constant from '@core/app/actions/beambox/constant';
import NS from '@core/app/constants/namespaces';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import { setAttributes } from '@core/helpers/element/attribute';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

class GuideLineDrawer {
  container: null | SVGSVGElement = null;
  lineHorizontal: null | SVGElement = null;
  lineVertical: null | SVGElement = null;

  init() {
    this.createElements();
    this.updateCanvasSize();
    this.updateVisible();
    this.updatePosition();

    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

    canvasEvents.on('canvas-change', this.updateCanvasSize.bind(this));
    useGlobalPreferenceStore.subscribe((state) => state.show_guides, this.updateVisible);
    useGlobalPreferenceStore.subscribe(
      (state) => [state.guide_x0, state.guide_y0],
      ([x, y]) => {
        this.updatePosition(x, y);
      },
      { equalityFn: shallow },
    );
  }

  private createElements() {
    const { height, width } = workareaManager;
    const canvasBG = document.getElementById('canvasBackground')!;
    const container = document.createElementNS(NS.SVG, 'svg');
    // const lineVertical = document.createElementNS(NS.SVG, 'path');
    // const lineHorizontal = document.createElementNS(NS.SVG, 'path');
    const lineVertical = document.createElementNS(NS.SVG, 'line');
    const lineHorizontal = document.createElementNS(NS.SVG, 'line');

    setAttributes(container, {
      height: '100%',
      id: 'guidesLines',
      style: 'pointer-events: none',
      viewBox: `0 0 ${width} ${height}`,
      width: '100%',
      x: '0',
      y: '0',
    });

    setAttributes(lineHorizontal, {
      fill: 'none',
      id: 'horizontal_guide',
      stroke: '#000',
      'stroke-dasharray': '5, 5',
      'stroke-opacity': '0.8',
      'stroke-width': '2',
      style: 'pointer-events:none',
      'vector-effect': 'non-scaling-stroke',
    });

    setAttributes(lineVertical, {
      fill: 'none',
      id: 'vertical_guide',
      stroke: '#000',
      'stroke-dasharray': '5, 5',
      'stroke-opacity': '0.8',
      'stroke-width': '2',
      style: 'pointer-events:none',
      'vector-effect': 'non-scaling-stroke',
    });

    container.appendChild(lineHorizontal);
    container.appendChild(lineVertical);
    canvasBG.appendChild(container);
    this.container = container;
    this.lineHorizontal = lineHorizontal;
    this.lineVertical = lineVertical;
  }

  updateVisible = (visible: boolean = useGlobalPreferenceStore.getState().show_guides) => {
    if (this.container) this.container.style.display = visible ? 'inline' : 'none';
  };

  updateCanvasSize = () => {
    const { height, maxY, minY, width } = workareaManager;

    if (this.container) this.container.setAttribute('viewBox', `0 0 ${width} ${height}`);

    if (this.lineVertical) setAttributes(this.lineVertical, { y1: minY.toString(), y2: maxY.toString() });

    if (this.lineHorizontal) setAttributes(this.lineHorizontal, { x1: '0', x2: width.toString() });
  };

  updatePosition = (
    x = useGlobalPreferenceStore.getState().guide_x0,
    y = useGlobalPreferenceStore.getState().guide_y0,
  ) => {
    const strX = (x * constant.dpmm).toString();
    const strY = (y * constant.dpmm).toString();

    if (this.lineVertical) setAttributes(this.lineVertical, { x1: strX, x2: strX });

    if (this.lineHorizontal) {
      setAttributes(this.lineHorizontal, { y1: strY, y2: strY });
    }
  };
}

export const guideLineDrawer = new GuideLineDrawer();
