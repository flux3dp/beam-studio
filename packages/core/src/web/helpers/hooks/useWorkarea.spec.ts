import useWorkarea from './useWorkarea';

const mockOn = jest.fn();
const mockOff = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    on: (...args) => mockOn(...args),
    off: (...args) => mockOff(...args),
  }),
}));

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (key: string) => mockRead(key),
}));

const mockUseEffect = jest.fn();
const mockUseState = jest.fn();
jest.mock('react', () => ({
  useEffect: (...args) => mockUseEffect(...args),
  useState: (...args) => mockUseState(...args),
}));
const mockSetState = jest.fn();

describe('test useWorkarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return workarea', () => {
    const workarea = 'fbm1';
    mockUseState.mockReturnValue([workarea, mockSetState]);
    mockRead.mockReturnValue(workarea);
    const result = useWorkarea();
    expect(result).toEqual(workarea);
  });

  it('should call onUpdateWorkArea when mount', () => {
    const workarea = 'fbm1';
    mockUseState.mockReturnValue([workarea, mockSetState]);
    mockRead.mockReturnValue(workarea);
    useWorkarea();
    expect(mockUseEffect).toBeCalledTimes(1);
    const effect = mockUseEffect.mock.calls[0][0];
    expect(mockOn).not.toBeCalled();
    const cleanup = effect();
    expect(mockOn).toBeCalledTimes(1);
    expect(mockOn).toBeCalledWith('model-changed', expect.any(Function));
    const handler = mockOn.mock.calls[0][1];
    expect(mockSetState).not.toBeCalled();
    mockRead.mockReturnValue('fbm2');
    handler();
    expect(mockRead).toBeCalledTimes(2);
    expect(mockSetState).toBeCalledTimes(1);
    expect(mockSetState).toBeCalledWith('fbm2');
    expect(mockOff).not.toBeCalled();
    cleanup();
    expect(mockOff).toBeCalledTimes(1);
  });
});
