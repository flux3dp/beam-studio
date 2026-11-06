import type backgroundTasksType from './index';
import type { BackgroundTask, BackgroundTaskId } from './types';

const mockDeviceMaster = {
  available: [] as Array<{ uuid: string }>,
  currentControlMode: '' as null | string,
  currentDevice: null as null | { info: { serial: string } },
  getAvailableDevices: () => mockDeviceMaster.available,
  select: jest.fn(),
};

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockDeviceMaster.currentControlMode;
  },
  get currentDevice() {
    return mockDeviceMaster.currentDevice;
  },
  getAvailableDevices: () => mockDeviceMaster.getAvailableDevices(),
  select: (...args) => mockDeviceMaster.select(...args),
}));

const mockHasAnyModal = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({ hasAnyModal: () => mockHasAnyModal() }));

const mockPreview = { isPreviewMode: false, isStarting: false };

jest.mock('@core/app/actions/beambox/preview-mode-controller', () => ({
  get isPreviewMode() {
    return mockPreview.isPreviewMode;
  },
  get isStarting() {
    return mockPreview.isStarting;
  },
}));
jest.mock('@core/helpers/is-web', () => () => false);

const mockPopUp = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popById: (...args) => mockPopById(...args),
  popUp: (...args) => mockPopUp(...args),
}));
jest.mock('@core/helpers/i18n', () => ({ lang: { message: { device_is_used: 'device is used' } } }));
jest.mock('@core/app/actions/tabController', () => ({ isFocused: true, onBlurred: jest.fn(), onFocused: jest.fn() }));
jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: { getState: () => ({ mode: 1 }), subscribe: jest.fn() },
}));
jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => ({ workarea: 'fpm1' }), subscribe: jest.fn() },
}));

const makeTask = (id: BackgroundTaskId, log: string[]) => {
  const task = {
    abort: jest.fn(async () => {
      log.push(`abort ${id}`);
    }),
    busy: false,
    busyMessage: () => `${id} is busy`,
    enabled: true,
    id,
    isBusy: () => task.busy,
    isEnabled: () => task.enabled,
    models: new Set(['fpm1']),
    start: jest.fn(() => log.push(`start ${id}`)),
    stop: jest.fn(() => log.push(`stop ${id}`)),
  };

  return task as BackgroundTask & { busy: boolean; enabled: boolean };
};

const deviceA = { model: 'fpm1', serial: 'A', uuid: 'a' } as any;
const deviceB = { model: 'fpm1', serial: 'B', uuid: 'b' } as any;

describe('backgroundTasks', () => {
  let backgroundTasks: typeof backgroundTasksType;
  let log: string[];

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockDeviceMaster.currentDevice = null;
    mockDeviceMaster.currentControlMode = '';
    mockDeviceMaster.available = [];
    mockHasAnyModal.mockReturnValue(false);
    mockPreview.isPreviewMode = false;
    mockPreview.isStarting = false;
    mockDeviceMaster.select.mockReset();
    mockPopUp.mockReset();
    backgroundTasks = require('./index').default;
    log = [];
  });

  test('the higher-priority task claims the machine, the other waits and is warned about once', () => {
    const low = makeTask('auto-full-area-preview', log);
    const high = makeTask('promark-button', log);

    backgroundTasks.register(low);
    backgroundTasks.register(high);
    backgroundTasks.setDevice(deviceA);
    backgroundTasks.refresh();

    expect(log).toEqual(['start promark-button']);
    expect(mockDeviceMaster.select).toHaveBeenCalledWith(deviceA, { silent: true });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(backgroundTasks.list().map(({ id, running }) => [id, running])).toEqual([
      ['promark-button', true],
      ['auto-full-area-preview', false],
    ]);
  });

  test('when the winner steps back, the loser starts only after the winner stopped', () => {
    const low = makeTask('auto-full-area-preview', log);
    const high = makeTask('promark-button', log);

    backgroundTasks.register(low);
    backgroundTasks.register(high);
    backgroundTasks.setDevice(deviceA);
    high.enabled = false;
    backgroundTasks.refresh();

    expect(log).toEqual(['start promark-button', 'stop promark-button', 'start auto-full-area-preview']);
  });

  test('a new top-bar machine restarts the task on it', () => {
    const task = makeTask('promark-button', log);

    backgroundTasks.register(task);
    backgroundTasks.setDevice(deviceA);
    backgroundTasks.setDevice(deviceB);
    backgroundTasks.setDevice(null);

    expect(log).toEqual(['start promark-button', 'stop promark-button', 'start promark-button', 'stop promark-button']);
    expect(task.start).toHaveBeenLastCalledWith(deviceB);
  });

  test('isCurrent follows deviceMaster', () => {
    const task = makeTask('promark-button', log);

    backgroundTasks.register(task);
    backgroundTasks.setDevice(deviceA);
    expect(backgroundTasks.isCurrent(task)).toBe(false);
    mockDeviceMaster.currentDevice = { info: { serial: 'A' } };
    expect(backgroundTasks.isCurrent(task)).toBe(true);
  });

  describe('yieldTo', () => {
    const setup = () => {
      const task = makeTask('promark-button', log);

      backgroundTasks.register(task);
      backgroundTasks.setDevice(deviceA);
      log.length = 0;

      return task;
    };

    test('resolves true without asking when no task is busy', async () => {
      setup();
      expect(await backgroundTasks.yieldTo(deviceA)).toBe(true);
      expect(mockPopUp).not.toHaveBeenCalled();
      expect(log).toEqual([]);
    });

    test('a busy task on another machine is aborted without asking', async () => {
      setup().busy = true;
      expect(await backgroundTasks.yieldTo(deviceB)).toBe(true);
      expect(mockPopUp).not.toHaveBeenCalled();
      expect(log).toEqual(['abort promark-button']);
    });

    test('a busy task on the same machine asks; Yes aborts', async () => {
      setup().busy = true;
      mockPopUp.mockImplementation(({ onYes }) => onYes());
      expect(await backgroundTasks.yieldTo(deviceA)).toBe(true);
      expect(mockPopUp).toHaveBeenCalledWith(expect.objectContaining({ message: 'promark-button is busy' }));
      expect(log).toEqual(['abort promark-button']);
    });

    test('No keeps the task running and cancels the action', async () => {
      setup().busy = true;
      mockPopUp.mockImplementation(({ onNo }) => onNo());
      expect(await backgroundTasks.yieldTo(deviceA)).toBe(false);
      expect(log).toEqual([]);
    });

    test('a busy task that is cheap to stop is aborted without asking', async () => {
      const task = setup();

      task.busy = true;
      task.busyMessage = () => null;
      expect(await backgroundTasks.yieldTo(deviceA)).toBe(true);
      expect(mockPopUp).not.toHaveBeenCalled();
      expect(log).toEqual(['abort promark-button']);
    });

    test('closes the prompt and continues when the task finishes before an answer', async () => {
      jest.useFakeTimers();

      const task = setup();

      task.busy = true;

      const result = backgroundTasks.yieldTo(deviceA);

      await jest.advanceTimersByTimeAsync(1000);
      expect(mockPopById).not.toHaveBeenCalled();

      task.busy = false;
      await jest.advanceTimersByTimeAsync(500);
      expect(mockPopById).toHaveBeenCalledWith('background-task-yield');
      expect(await result).toBe(true);
      expect(log).toEqual([]);
      jest.useRealTimers();
    });
  });

  describe('reselect', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const setup = () => {
      backgroundTasks.register(makeTask('promark-button', log));
      backgroundTasks.setDevice(deviceA);
      mockDeviceMaster.select.mockClear();
      // a foreground flow moved deviceMaster to B
      mockDeviceMaster.currentDevice = { info: { serial: 'B' } };
      mockDeviceMaster.available = [{ uuid: 'a' }];
    };

    test('points deviceMaster back at the top-bar machine once quiet', async () => {
      setup();
      mockHasAnyModal.mockReturnValue(true);
      await jest.advanceTimersByTimeAsync(5000);
      expect(mockDeviceMaster.select).not.toHaveBeenCalled();

      mockHasAnyModal.mockReturnValue(false);
      await jest.advanceTimersByTimeAsync(5000);
      expect(mockDeviceMaster.select).toHaveBeenCalledWith(deviceA, { silent: true });
    });

    test.each([
      ['manual preview is on', () => (mockPreview.isPreviewMode = true)],
      ['the other machine is in a sub-task', () => (mockDeviceMaster.currentControlMode = 'raw')],
      ['the top-bar machine is offline', () => (mockDeviceMaster.available = [])],
    ])('waits while %s', async (_, arrange) => {
      setup();
      arrange();
      await jest.advanceTimersByTimeAsync(10000);
      expect(mockDeviceMaster.select).not.toHaveBeenCalled();
    });

    test('does nothing while deviceMaster already talks to the top-bar machine', async () => {
      setup();
      mockDeviceMaster.currentDevice = { info: { serial: 'A' } };
      await jest.advanceTimersByTimeAsync(10000);
      expect(mockDeviceMaster.select).not.toHaveBeenCalled();
    });

    test('silently reconnects the top-bar machine after its socket dropped', async () => {
      setup();
      mockDeviceMaster.currentDevice = { info: { serial: 'A' } };
      mockDeviceMaster.currentControlMode = null;
      await jest.advanceTimersByTimeAsync(5000);
      expect(mockDeviceMaster.select).toHaveBeenCalledWith(deviceA, { silent: true });
    });
  });
});
