import type backgroundTasksType from './index';
import type { BackgroundTask, BackgroundTaskId } from './types';

const mockDeviceMaster = { currentDevice: null as null | { info: { serial: string } }, select: jest.fn() };

jest.mock('@core/helpers/device-master', () => mockDeviceMaster);
jest.mock('@core/helpers/is-web', () => () => false);
jest.mock('@core/app/actions/tabController', () => ({ isFocused: true, onBlurred: jest.fn(), onFocused: jest.fn() }));
jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: { getState: () => ({ mode: 1 }), subscribe: jest.fn() },
}));
jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => ({ workarea: 'fpm1' }), subscribe: jest.fn() },
}));

const makeTask = (id: BackgroundTaskId, log: string[]) => {
  const task = {
    abort: jest.fn(),
    enabled: true,
    id,
    isBusy: () => false,
    isEnabled: () => task.enabled,
    models: new Set(['fpm1']),
    start: jest.fn(() => log.push(`start ${id}`)),
    stop: jest.fn(() => log.push(`stop ${id}`)),
  };

  return task as BackgroundTask & { enabled: boolean };
};

const deviceA = { model: 'fpm1', serial: 'A' } as any;
const deviceB = { model: 'fpm1', serial: 'B' } as any;

describe('backgroundTasks', () => {
  let backgroundTasks: typeof backgroundTasksType;
  let log: string[];

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockDeviceMaster.currentDevice = null;
    mockDeviceMaster.select.mockReset();
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
    expect(mockDeviceMaster.select).toHaveBeenCalledWith(deviceA);
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
});
