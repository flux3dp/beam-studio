import { EventEmitter } from 'eventemitter3';

import constant from '@core/app/actions/beambox/constant';
import NS from '@core/app/constants/namespaces';

const mockSetAttributes = jest.fn();

jest.mock('@core/helpers/element/attribute', () => ({
  setAttributes: mockSetAttributes,
}));

// Mock useGlobalPreferenceStore
const mockSubscribe = jest.fn();
const mockGetState = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: mockGetState,
    subscribe: mockSubscribe,
  },
}));

// Mock workareaManager
const mockWorkareaManager = {
  height: 2100,
  maxY: 2100,
  minY: 0,
  width: 3000,
};

jest.mock('@core/app/svgedit/workarea', () => mockWorkareaManager);

// Mock eventEmitterFactory
const mockEventEmitter = new EventEmitter();
const mockCreateEventEmitter = jest.fn(() => mockEventEmitter);

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: mockCreateEventEmitter,
}));

import { guideLineDrawer } from './guideLines';

// Mock DOM methods
const mockCreateElementNS = jest.fn();
const mockAppendChild = jest.fn();
const mockGetElementById = jest.fn();
const mockSetAttribute = jest.fn();

// Setup DOM mocks
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Mock document methods
  document.createElementNS = mockCreateElementNS;
  document.getElementById = mockGetElementById;

  // Create mock SVG elements
  const mockContainer = {
    appendChild: mockAppendChild,
    setAttribute: mockSetAttribute,
    style: { display: 'inline' },
  };

  const mockLineHorizontal = {};
  const mockLineVertical = {};
  const mockCanvasBG = {
    appendChild: mockAppendChild,
  };

  // Setup mock return values
  mockCreateElementNS
    .mockReturnValueOnce(mockContainer) // container
    .mockReturnValueOnce(mockLineVertical) // lineVertical
    .mockReturnValueOnce(mockLineHorizontal); // lineHorizontal

  mockGetElementById.mockReturnValue(mockCanvasBG);

  // Setup default preference store state
  mockGetState.mockReturnValue({
    guide_x0: 0,
    guide_y0: 0,
    show_guides: false,
  });

  // Clear any existing state on the guideLineDrawer instance
  guideLineDrawer.container = null;
  guideLineDrawer.lineHorizontal = null;
  guideLineDrawer.lineVertical = null;
});

describe('GuideLineDrawer', () => {
  describe('initialization', () => {
    it('should create SVG elements with correct attributes on init', () => {
      guideLineDrawer.init();

      // Verify SVG elements were created
      expect(mockCreateElementNS).toHaveBeenCalledWith(NS.SVG, 'svg');
      expect(mockCreateElementNS).toHaveBeenCalledWith(NS.SVG, 'line');
      expect(mockCreateElementNS).toHaveBeenCalledTimes(3); // container + 2 lines

      // Verify container attributes were set
      expect(mockSetAttributes).toHaveBeenCalledWith(expect.any(Object), {
        height: '100%',
        id: 'guidesLines',
        style: 'pointer-events: none; overflow: hidden',
        viewBox: `0 0 ${mockWorkareaManager.width} ${mockWorkareaManager.height}`,
        width: '100%',
        x: '0',
        y: '0',
      });

      // Verify horizontal line attributes
      expect(mockSetAttributes).toHaveBeenCalledWith(expect.any(Object), {
        fill: 'none',
        id: 'horizontal_guide',
        stroke: '#000',
        'stroke-dasharray': '5, 5',
        'stroke-opacity': '0.8',
        'stroke-width': '2',
        style: 'pointer-events:none',
        'vector-effect': 'non-scaling-stroke',
      });

      // Verify vertical line attributes
      expect(mockSetAttributes).toHaveBeenCalledWith(expect.any(Object), {
        fill: 'none',
        id: 'vertical_guide',
        stroke: '#000',
        'stroke-dasharray': '5, 5',
        'stroke-opacity': '0.8',
        'stroke-width': '2',
        style: 'pointer-events:none',
        'vector-effect': 'non-scaling-stroke',
      });

      // Verify DOM structure was built
      expect(mockAppendChild).toHaveBeenCalledTimes(3); // 2 lines to container + container to canvasBG
    });

    it('should subscribe to canvas events and preference store changes', () => {
      guideLineDrawer.init();

      // Verify event emitter was created for canvas events
      expect(mockCreateEventEmitter).toHaveBeenCalledWith('canvas');

      // Verify subscriptions were set up
      expect(mockSubscribe).toHaveBeenCalledWith(
        expect.any(Function), // selector for show_guides
        expect.any(Function), // callback for updateVisible
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        expect.any(Function), // selector for [guide_x0, guide_y0]
        expect.any(Function), // callback for updatePosition
        { equalityFn: expect.any(Function) },
      );
    });
  });

  describe('updateVisible', () => {
    beforeEach(() => {
      guideLineDrawer.init();
    });

    it('should show container when visible is true', () => {
      const mockContainer = { style: { display: 'none' } };

      guideLineDrawer.container = mockContainer as any;

      guideLineDrawer.updateVisible(true);

      expect(mockContainer.style.display).toBe('inline');
    });

    it('should hide container when visible is false', () => {
      const mockContainer = { style: { display: 'inline' } };

      guideLineDrawer.container = mockContainer as any;

      guideLineDrawer.updateVisible(false);

      expect(mockContainer.style.display).toBe('none');
    });

    it('should use default value from preference store when no parameter provided', () => {
      const mockContainer = { style: { display: 'none' } };

      guideLineDrawer.container = mockContainer as any;

      mockGetState.mockReturnValue({ show_guides: true });

      guideLineDrawer.updateVisible();

      expect(mockContainer.style.display).toBe('inline');
    });

    it('should do nothing when container is null', () => {
      guideLineDrawer.container = null;

      expect(() => guideLineDrawer.updateVisible(true)).not.toThrow();
    });
  });

  describe('updateCanvasSize', () => {
    beforeEach(() => {
      guideLineDrawer.init();
    });

    it('should update container viewBox with workarea dimensions', () => {
      const mockContainer = { setAttribute: jest.fn() };

      guideLineDrawer.container = mockContainer as any;

      guideLineDrawer.updateCanvasSize();

      expect(mockContainer.setAttribute).toHaveBeenCalledWith(
        'viewBox',
        `0 0 ${mockWorkareaManager.width} ${mockWorkareaManager.height}`,
      );
    });

    it('should update vertical line Y coordinates', () => {
      const mockVerticalLine = {};

      guideLineDrawer.lineVertical = mockVerticalLine as any;

      guideLineDrawer.updateCanvasSize();

      expect(mockSetAttributes).toHaveBeenCalledWith(mockVerticalLine, {
        y1: mockWorkareaManager.minY.toString(),
        y2: mockWorkareaManager.maxY.toString(),
      });
    });

    it('should update horizontal line X coordinates', () => {
      const mockHorizontalLine = {};

      guideLineDrawer.lineHorizontal = mockHorizontalLine as any;

      guideLineDrawer.updateCanvasSize();

      expect(mockSetAttributes).toHaveBeenCalledWith(mockHorizontalLine, {
        x1: '0',
        x2: mockWorkareaManager.width.toString(),
      });
    });

    it('should handle null elements gracefully', () => {
      guideLineDrawer.container = null;
      guideLineDrawer.lineVertical = null;
      guideLineDrawer.lineHorizontal = null;

      expect(() => guideLineDrawer.updateCanvasSize()).not.toThrow();
    });
  });

  describe('updatePosition', () => {
    beforeEach(() => {
      guideLineDrawer.init();
    });

    it('should update line positions with provided coordinates', () => {
      const mockVerticalLine = {};
      const mockHorizontalLine = {};

      guideLineDrawer.lineVertical = mockVerticalLine as any;
      guideLineDrawer.lineHorizontal = mockHorizontalLine as any;

      const x = 10;
      const y = 20;

      guideLineDrawer.updatePosition(x, y);

      const expectedX = (x * constant.dpmm).toString();
      const expectedY = (y * constant.dpmm).toString();

      expect(mockSetAttributes).toHaveBeenCalledWith(mockVerticalLine, {
        x1: expectedX,
        x2: expectedX,
      });

      expect(mockSetAttributes).toHaveBeenCalledWith(mockHorizontalLine, {
        y1: expectedY,
        y2: expectedY,
      });
    });

    it('should use default values from preference store when no parameters provided', () => {
      const mockVerticalLine = {};
      const mockHorizontalLine = {};

      guideLineDrawer.lineVertical = mockVerticalLine as any;
      guideLineDrawer.lineHorizontal = mockHorizontalLine as any;

      mockGetState.mockReturnValue({
        guide_x0: 15,
        guide_y0: 25,
      });

      guideLineDrawer.updatePosition();

      const expectedX = (15 * constant.dpmm).toString();
      const expectedY = (25 * constant.dpmm).toString();

      expect(mockSetAttributes).toHaveBeenCalledWith(mockVerticalLine, {
        x1: expectedX,
        x2: expectedX,
      });

      expect(mockSetAttributes).toHaveBeenCalledWith(mockHorizontalLine, {
        y1: expectedY,
        y2: expectedY,
      });
    });

    it('should handle null elements gracefully', () => {
      guideLineDrawer.lineVertical = null;
      guideLineDrawer.lineHorizontal = null;

      expect(() => guideLineDrawer.updatePosition(10, 20)).not.toThrow();
    });

    it('should convert coordinates using dpmm constant', () => {
      const mockVerticalLine = {};

      guideLineDrawer.lineVertical = mockVerticalLine as any;

      const x = 5.5;

      guideLineDrawer.updatePosition(x, 0);

      const expectedX = (x * constant.dpmm).toString(); // 5.5 * 10 = 55

      expect(mockSetAttributes).toHaveBeenCalledWith(mockVerticalLine, {
        x1: expectedX,
        x2: expectedX,
      });
    });
  });

  describe('canvas event integration', () => {
    it('should listen for canvas-change events and update canvas size', () => {
      const mockOn = jest.fn();

      mockEventEmitter.on = mockOn;

      guideLineDrawer.init();

      expect(mockOn).toHaveBeenCalledWith('canvas-change', expect.any(Function));

      // Verify the bound function is updateCanvasSize
      const canvasChangeCallback = mockOn.mock.calls[0][1];

      const mockContainer = { setAttribute: jest.fn() };

      guideLineDrawer.container = mockContainer as any;

      // Call the callback to simulate canvas-change event
      canvasChangeCallback();

      expect(mockContainer.setAttribute).toHaveBeenCalledWith(
        'viewBox',
        `0 0 ${mockWorkareaManager.width} ${mockWorkareaManager.height}`,
      );
    });
  });

  describe('preference store integration', () => {
    it('should call updateVisible when show_guides preference changes', () => {
      guideLineDrawer.init();

      // Find the show_guides subscription
      const showGuidesCall = mockSubscribe.mock.calls.find((call) => call[0].toString().includes('show_guides'));

      expect(showGuidesCall).toBeDefined();

      const callback = showGuidesCall[1];
      const mockContainer = { style: { display: 'none' } };

      guideLineDrawer.container = mockContainer as any;

      // Simulate preference change
      callback(true);

      expect(mockContainer.style.display).toBe('inline');
    });

    it('should call updatePosition when guide coordinates change', () => {
      guideLineDrawer.init();

      // Find the guide coordinates subscription
      const coordinatesCall = mockSubscribe.mock.calls.find((call) => call[0].toString().includes('guide_x0'));

      expect(coordinatesCall).toBeDefined();

      const callback = coordinatesCall[1];
      const mockVerticalLine = {};
      const mockHorizontalLine = {};

      guideLineDrawer.lineVertical = mockVerticalLine as any;
      guideLineDrawer.lineHorizontal = mockHorizontalLine as any;

      // Simulate coordinate change
      const newCoords = [30, 40];

      callback(newCoords);

      const expectedX = (30 * constant.dpmm).toString();
      const expectedY = (40 * constant.dpmm).toString();

      expect(mockSetAttributes).toHaveBeenCalledWith(mockVerticalLine, {
        x1: expectedX,
        x2: expectedX,
      });

      expect(mockSetAttributes).toHaveBeenCalledWith(mockHorizontalLine, {
        y1: expectedY,
        y2: expectedY,
      });
    });
  });

  describe('exported instance', () => {
    it('should export a singleton instance of GuideLineDrawer', () => {
      expect(guideLineDrawer).toBeDefined();
      expect(typeof guideLineDrawer.init).toBe('function');
      expect(typeof guideLineDrawer.updateVisible).toBe('function');
      expect(typeof guideLineDrawer.updateCanvasSize).toBe('function');
      expect(typeof guideLineDrawer.updatePosition).toBe('function');
    });
  });
});
