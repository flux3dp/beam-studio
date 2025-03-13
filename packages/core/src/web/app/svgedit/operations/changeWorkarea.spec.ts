import changeWorkarea from './changeWorkarea';

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockSetWorkarea = jest.fn();
const mockResetView = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  resetView: (...args) => mockResetView(...args),
  setWorkarea: (...args) => mockSetWorkarea(...args),
}));

const mockToggleFullColorAfterWorkareaChange = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  toggleFullColorAfterWorkareaChange: (...args) => mockToggleFullColorAfterWorkareaChange(...args),
}));

const mockChangeBeamboxPreferenceValue = jest.fn();

jest.mock('@core/app/svgedit/history/beamboxPreferenceCommand', () => ({
  changeBeamboxPreferenceValue: (...args) => mockChangeBeamboxPreferenceValue(...args),
}));

describe('test changeWorkarea', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should work correctly', () => {
    mockRead.mockReturnValue('fbm1');

    const mockCmd = { onAfter: () => {} };

    mockChangeBeamboxPreferenceValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1');
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockChangeBeamboxPreferenceValue).toHaveBeenCalledTimes(1);
    expect(mockChangeBeamboxPreferenceValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('fbm1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    mockRead.mockReturnValue('ado1');
    onAfter();
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('ado1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);
  });

  it('should work correctly with toggleModule = false', () => {
    mockRead.mockReturnValue('fbm1');

    const mockCmd = { onAfter: () => {} };

    mockChangeBeamboxPreferenceValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1', { toggleModule: false });
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockChangeBeamboxPreferenceValue).toHaveBeenCalledTimes(1);
    expect(mockChangeBeamboxPreferenceValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('fbm1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    mockRead.mockReturnValue('ado1');
    onAfter();
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenLastCalledWith('workarea');
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('ado1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();
  });
});
