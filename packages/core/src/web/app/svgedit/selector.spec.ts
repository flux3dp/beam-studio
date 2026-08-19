import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

jest.mock('@core/app/components/beambox/RightPanel/contexts/ObjectPanelController', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@core/app/components/beambox/RightPanel/DimensionPanel/utils', () => ({ getValue: jest.fn() }));
jest.mock('@core/app/stores/screenStore', () => ({ isMobile: jest.fn(() => false) }));
jest.mock('../stores/canvas/utils/mouseMode', () => ({ getMouseMode: jest.fn() }));
jest.mock('../stores/storageStore', () => ({ getStorage: jest.fn() }));
jest.mock('./text/textedit/getters', () => ({ getIsVertical: jest.fn(), isFitText: jest.fn() }));
jest.mock('./transform/rotation', () => ({ getRotationAngle: jest.fn() }));
jest.mock('./transform/transformlist', () => ({ getTransformList: jest.fn() }));
jest.mock('./utils/getBBox', () => ({ getBBox: jest.fn(), getBBoxFromElements: jest.fn() }));
jest.mock('./workarea', () => ({ zoomRatio: 1 }));

import selector, { SelectorManager } from './selector';

describe('SelectorManager zoom updates', () => {
  test('coalesces zoom events into one microtask without adding listeners on reinitialization', async () => {
    const svgRoot = document.createElementNS(window.svgedit.NS.SVG, 'svg');

    document.body.appendChild(svgRoot);
    selector.init({ svgRoot: () => svgRoot });

    const manager = new SelectorManager();
    const handleZoomChange = jest.spyOn(manager, 'handleZoomChange').mockImplementation();
    const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

    canvasEventEmitter.emit('zoom-changed');
    canvasEventEmitter.emit('zoom-changed');
    expect(handleZoomChange).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(handleZoomChange).toHaveBeenCalledTimes(1);

    manager.initGroup();
    canvasEventEmitter.emit('zoom-changed');
    canvasEventEmitter.emit('zoom-changed');
    await Promise.resolve();
    expect(handleZoomChange).toHaveBeenCalledTimes(2);

    svgRoot.remove();
  });
});
