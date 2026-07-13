import { getAddOnInfo } from '@core/app/constants/addOn';
import { useDocumentStore } from '@core/app/stores/documentStore';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

// --- mocks -----------------------------------------------------------------

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: any[]) => mockAddCommandToHistory(...args),
}));

const mockAddSubCommand = jest.fn();
const mockBatchCommand = jest.fn();
const mockChangeElementCommand = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: class {
    onAfter: (() => void) | undefined;
    addSubCommand = (...args: any[]) => mockAddSubCommand(...args);
    constructor(...args: any[]) {
      mockBatchCommand(...args);
    }
  },
  ChangeElementCommand: class {
    constructor(...args: any[]) {
      mockChangeElementCommand(...args);
    }
  },
}));

// import AFTER mocks — this registers canvas-change / document-settings-saved listeners
import rotaryAxis from './rotary-axis';

const canvasEmitter = eventEmitterFactory.createEventEmitter('canvas');

// constant.dpmm === 10 (px per mm)
const DPMM = 10;

const resetDocumentStore = () => {
  useDocumentStore.setState({
    'customized-dimension': { fpm1: { height: 150, width: 150 } },
    'enable-job-origin': false,
    'rotary-y': null,
    rotary_mode: false,
    workarea: 'fbb1b',
  } as any);
};

const getLine = () => document.getElementById('rotaryLine') as unknown as SVGLineElement;
const getTransparentLine = () => document.getElementById('transparentRotaryLine') as unknown as SVGLineElement;

describe('rotary-axis', () => {
  // The module caches the created lines at module scope, so #fixedSizeSvg must exist
  // before the (one-time) init() and must persist for the whole suite — rebuilding
  // document.body between tests would orphan the cached line elements.
  beforeAll(() => {
    document.body.innerHTML = '<svg id="fixedSizeSvg"></svg>';
    (workareaManager as any).maxY = 2100;
    resetDocumentStore();
    rotaryAxis.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetDocumentStore();
    // maxY on the real workareaManager singleton is deterministic (default 2100)
    (workareaManager as any).maxY = 2100;
    // reset the persistent lines to a known state
    rotaryAxis.setPosition(0, { write: false });
    getLine()?.setAttribute('display', 'none');
    getTransparentLine()?.setAttribute('display', 'none');
  });

  describe('init', () => {
    test('created the rotary axis overlay and lines inside #fixedSizeSvg', () => {
      const container = document.getElementById('rotaryAxis');

      expect(container).not.toBeNull();
      expect(container?.parentElement?.id).toBe('fixedSizeSvg');
      expect(getLine()).not.toBeNull();
      expect(getTransparentLine()).not.toBeNull();
      // stroke widths distinguish the visible line (3) from the wide hit-target (7)
      expect(getLine().getAttribute('stroke-width')).toBe('3');
      expect(getTransparentLine().getAttribute('stroke-width')).toBe('7');
    });

    test('is idempotent — a second init call does not recreate the line', () => {
      rotaryAxis.setPosition(400);

      rotaryAxis.init(); // already initialized -> early return, keeps position

      expect(rotaryAxis.getPosition()).toBe(400);
      expect(document.querySelectorAll('#rotaryLine')).toHaveLength(1);
    });
  });

  describe('setPosition / getPosition round-trip', () => {
    test('px round-trips exactly and writes both lines', () => {
      rotaryAxis.setPosition(250);

      expect(getLine().getAttribute('y1')).toBe('250');
      expect(getLine().getAttribute('y2')).toBe('250');
      expect(getTransparentLine().getAttribute('y1')).toBe('250');
      expect(getTransparentLine().getAttribute('y2')).toBe('250');
      expect(rotaryAxis.getPosition()).toBe(250);
      expect(rotaryAxis.getPosition(false)).toBe(250);
    });

    test('mm input is converted to px via dpmm (×10) when setting', () => {
      rotaryAxis.setPosition(30, { unit: 'mm' });

      // 30 mm * 10 dpmm = 300 px
      expect(getLine().getAttribute('y1')).toBe('300');
      expect(rotaryAxis.getPosition(false)).toBe(300);
    });

    test('getPosition(mm=true) converts stored px back to mm via dpmm (÷10)', () => {
      rotaryAxis.setPosition(300); // px

      expect(rotaryAxis.getPosition(true)).toBe(300 / DPMM); // 30 mm
    });

    test('mm -> px -> mm round-trips a fractional value', () => {
      rotaryAxis.setPosition(12.5, { unit: 'mm' }); // 125 px

      expect(rotaryAxis.getPosition(false)).toBe(125);
      expect(rotaryAxis.getPosition(true)).toBe(12.5);
    });

    test('getPosition rounds px to 2 decimals', () => {
      getLine().setAttribute('y1', '123.4567');

      expect(rotaryAxis.getPosition(false)).toBe(123.46);
    });

    test('write=true persists position to document store (rotary-y in px)', () => {
      rotaryAxis.setPosition(42, { write: true });

      expect(useDocumentStore.getState()['rotary-y']).toBe(42);
    });

    test('write=false does not persist to document store', () => {
      useDocumentStore.setState({ 'rotary-y': 5 } as any);
      rotaryAxis.setPosition(999, { write: false });

      expect(useDocumentStore.getState()['rotary-y']).toBe(5);
    });
  });

  describe('toggleDisplay', () => {
    test('hides lines when rotary_mode is off', () => {
      useDocumentStore.setState({ rotary_mode: false } as any);
      rotaryAxis.toggleDisplay();

      expect(getLine().getAttribute('display')).toBe('none');
      expect(getTransparentLine().getAttribute('display')).toBe('none');
    });

    test('shows lines when rotary_mode is on and job origin disabled', () => {
      useDocumentStore.setState({ 'enable-job-origin': false, rotary_mode: true } as any);
      rotaryAxis.toggleDisplay();

      expect(getLine().getAttribute('display')).toBe('visible');
      expect(getTransparentLine().getAttribute('display')).toBe('visible');
    });

    test('hides lines when rotary_mode is on but job origin is enabled on a workarea that supports it', () => {
      // ado1 supports jobOrigin per getAddOnInfo
      expect(getAddOnInfo('ado1').jobOrigin).toBe(true);
      useDocumentStore.setState({
        'enable-job-origin': true,
        rotary_mode: true,
        workarea: 'ado1',
      } as any);
      rotaryAxis.toggleDisplay();

      expect(getLine().getAttribute('display')).toBe('none');
    });
  });

  describe('boundary clamping (updateBoundary via canvas-change)', () => {
    test('clamps position within a workarea-specific boundary (ado1: 0–300 mm => 0–3000 px)', () => {
      useDocumentStore.setState({ 'enable-job-origin': false, workarea: 'ado1' } as any);

      // above the max boundary (300 mm * 10 = 3000 px)
      rotaryAxis.setPosition(5000);
      canvasEmitter.emit('canvas-change');
      expect(rotaryAxis.getPosition()).toBe(3000);

      // below the min boundary
      rotaryAxis.setPosition(-100);
      canvasEmitter.emit('canvas-change');
      expect(rotaryAxis.getPosition()).toBe(0);
    });

    test('falls back to [0, maxY] boundary when job origin is enabled', () => {
      (workareaManager as any).maxY = 2100;
      useDocumentStore.setState({ 'enable-job-origin': true, workarea: 'ado1' } as any);

      rotaryAxis.setPosition(9999);
      canvasEmitter.emit('canvas-change');
      // clamped to maxY (2100) because rotaryConstants boundary is bypassed when job origin on
      expect(rotaryAxis.getPosition()).toBe(2100);
    });

    test('document-settings-saved also recomputes the boundary and clamps', () => {
      useDocumentStore.setState({ 'enable-job-origin': false, workarea: 'ado1' } as any);

      rotaryAxis.setPosition(4000);
      canvasEmitter.emit('document-settings-saved');
      expect(rotaryAxis.getPosition()).toBe(3000);
    });
  });

  describe('checkMouseTarget', () => {
    test('returns true for an element inside #rotaryAxis', () => {
      expect(rotaryAxis.checkMouseTarget(getLine())).toBe(true);
    });

    test('returns false for an element outside #rotaryAxis', () => {
      const outside = document.createElement('div');

      document.body.appendChild(outside);
      expect(rotaryAxis.checkMouseTarget(outside)).toBe(false);
    });
  });

  describe('drag lifecycle (mouseDown / mouseMove / mouseUp)', () => {
    beforeEach(() => {
      useDocumentStore.setState({ 'enable-job-origin': false, workarea: 'ado1' } as any);
      // establish the ado1 boundary (0–3000 px) that mouseMove clamps against
      canvasEmitter.emit('canvas-change');
    });

    test('mouseMove sets position clamped to boundary without persisting', () => {
      useDocumentStore.setState({ 'rotary-y': 100 } as any);
      rotaryAxis.mouseMove(1500);

      expect(rotaryAxis.getPosition()).toBe(1500);
      // mouseMove uses write:false, so store is untouched
      expect(useDocumentStore.getState()['rotary-y']).toBe(100);
    });

    test('mouseMove clamps a drag beyond the max boundary', () => {
      rotaryAxis.mouseMove(99999);

      // ado1 max is 3000 px
      expect(rotaryAxis.getPosition()).toBe(3000);
    });

    test('mouseUp records an undoable batch command and persists the final position', () => {
      rotaryAxis.setPosition(200);
      rotaryAxis.mouseDown(); // captures startY = 200
      rotaryAxis.mouseMove(800);
      rotaryAxis.mouseUp();

      expect(mockBatchCommand).toHaveBeenCalledWith('Move Rotary Axis');
      expect(mockAddSubCommand).toHaveBeenCalledTimes(2);
      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
      // ChangeElementCommand captures the pre-drag startY (200) for both lines
      expect(mockChangeElementCommand).toHaveBeenCalledWith(getLine(), { y1: 200, y2: 200 });
      expect(mockChangeElementCommand).toHaveBeenCalledWith(getTransparentLine(), {
        y1: 200,
        y2: 200,
      });
      // final position persisted
      expect(useDocumentStore.getState()['rotary-y']).toBe(800);
    });

    test('batch command onAfter re-persists the current position', () => {
      rotaryAxis.setPosition(200);
      rotaryAxis.mouseDown();
      rotaryAxis.mouseMove(600);
      rotaryAxis.mouseUp();

      const batchCmd = mockAddCommandToHistory.mock.calls[0][0];

      useDocumentStore.setState({ 'rotary-y': 0 } as any);
      batchCmd.onAfter();
      expect(useDocumentStore.getState()['rotary-y']).toBe(600);
    });
  });

  describe('init initial position (fresh module instance)', () => {
    test('falls back to maxY / 2 when rotary-y is unset', () => {
      document.body.innerHTML = '<svg id="fixedSizeSvg"></svg>';
      (workareaManager as any).maxY = 2100;
      useDocumentStore.setState({ 'rotary-y': null } as any);

      let freshRotaryAxis: typeof rotaryAxis;

      jest.isolateModules(() => {
        freshRotaryAxis = require('./rotary-axis').default;
      });

      freshRotaryAxis!.init();
      // 2100 / 2 = 1050 px, since the (isolated) document store defaults rotary-y to null
      expect(freshRotaryAxis!.getPosition()).toBe(1050);
    });
  });
});
