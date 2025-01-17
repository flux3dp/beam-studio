import changeWorkarea from './changeWorkarea';

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockUpdate = jest.fn();
jest.mock('app/actions/beambox/open-bottom-boundary-drawer', () => ({
  update: () => mockUpdate(),
}));

const mockSetWorkarea = jest.fn();
const mockResetView = jest.fn();
jest.mock('app/svgedit/workarea', () => ({
  setWorkarea: (...args) => mockSetWorkarea(...args),
  resetView: (...args) => mockResetView(...args),
}));

const mockToggleFullColorAfterWorkareaChange = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  toggleFullColorAfterWorkareaChange: (...args) => mockToggleFullColorAfterWorkareaChange(...args),
}));

const mockChangeBeamboxPreferenceValue = jest.fn();
jest.mock('app/svgedit/history/beamboxPreferenceCommand', () => ({
  changeBeamboxPreferenceValue: (...args) => mockChangeBeamboxPreferenceValue(...args),
}));

describe('test changeWorkarea', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should work correctly', () => {
    mockRead.mockReturnValue('fbm1');
    const mockCmd = { onAfter: () => { } };
    mockChangeBeamboxPreferenceValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1');
    expect(mockRead).toBeCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockChangeBeamboxPreferenceValue).toBeCalledTimes(1);
    expect(mockChangeBeamboxPreferenceValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockSetWorkarea).toBeCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('fbm1');
    expect(mockResetView).toBeCalledTimes(1);
    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).toBeCalledTimes(1);

    const { onAfter } = mockCmd;
    jest.resetAllMocks();
    mockRead.mockReturnValue('ado1');
    onAfter();
    expect(mockRead).toBeCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockSetWorkarea).toBeCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('ado1');
    expect(mockResetView).toBeCalledTimes(1);
    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).toBeCalledTimes(1);
  });

  it('should work correctly with toggleModule = false', () => {
    mockRead.mockReturnValue('fbm1');
    const mockCmd = { onAfter: () => { } };
    mockChangeBeamboxPreferenceValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1', { toggleModule: false });
    expect(mockRead).toBeCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockChangeBeamboxPreferenceValue).toBeCalledTimes(1);
    expect(mockChangeBeamboxPreferenceValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockSetWorkarea).toBeCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('fbm1');
    expect(mockResetView).toBeCalledTimes(1);
    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();

    const { onAfter } = mockCmd;
    jest.resetAllMocks();
    mockRead.mockReturnValue('ado1');
    onAfter();
    expect(mockRead).toBeCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockSetWorkarea).toBeCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('ado1');
    expect(mockResetView).toBeCalledTimes(1);
    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();
  });
});
