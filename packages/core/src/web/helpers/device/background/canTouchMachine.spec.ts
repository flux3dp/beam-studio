import canTouchMachine from './canTouchMachine';

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

const mockDeviceMaster = { currentControlMode: '', getReport: jest.fn() };

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockDeviceMaster.currentControlMode;
  },
  getReport: () => mockDeviceMaster.getReport(),
}));

const mockIsCurrent = jest.fn();

jest.mock('./index', () => ({ isCurrent: (...args) => mockIsCurrent(...args) }));

const task = { id: 'auto-full-area-preview' } as any;

describe('canTouchMachine', () => {
  beforeEach(() => {
    mockHasAnyModal.mockReturnValue(false);
    mockPreview.isPreviewMode = false;
    mockPreview.isStarting = false;
    mockDeviceMaster.currentControlMode = '';
    mockDeviceMaster.getReport.mockResolvedValue({ st_id: 0 });
    mockIsCurrent.mockReturnValue(true);
  });

  test('true when nothing holds the machine and it is idle', async () => {
    expect(await canTouchMachine(task)).toBe(true);
    expect(mockIsCurrent).toHaveBeenCalledWith(task);
  });

  test.each([
    ['a modal is open', () => mockHasAnyModal.mockReturnValue(true)],
    ['manual preview is on', () => (mockPreview.isPreviewMode = true)],
    ['manual preview is starting', () => (mockPreview.isStarting = true)],
    ['a sub-task is open', () => (mockDeviceMaster.currentControlMode = 'raw')],
    ['the control socket dropped', () => (mockDeviceMaster.currentControlMode = null as any)],
    ['deviceMaster talks to another machine', () => mockIsCurrent.mockReturnValue(false)],
    ['the machine is not idle', () => mockDeviceMaster.getReport.mockResolvedValue({ st_id: 16 })],
    ['the report fails', () => mockDeviceMaster.getReport.mockRejectedValue(new Error('x'))],
  ])('false when %s', async (_, setup) => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    setup();
    expect(await canTouchMachine(task)).toBe(false);
  });
});
