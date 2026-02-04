const mockImportSvg = jest.fn();

jest.mock('@core/app/svgedit/operations/import/importSvg', () => mockImportSvg);

const mockWebsocket = jest.fn();

jest.mock('@core/helpers/websocket', () => mockWebsocket);

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeData: mockWriteData,
}));

const mockInitState = jest.fn();

jest.mock('@core/app/components/beambox/RightPanel/ConfigPanel/initState', () => mockInitState);

import aiExtension from './ai-extension';

const mockOnFocused = jest.fn();

jest.mock('@core/app/actions/tabController', () => ({
  isFocused: true,
  onFocused: (...args) => mockOnFocused(...args),
}));

const mockSend = jest.fn();

describe('test ai-extension', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebsocket.mockReturnValue({
      send: mockSend,
    });
  });

  test('set_handler', () => {
    aiExtension.init();
    expect(mockWebsocket).toHaveBeenCalledWith({
      method: 'push-studio',
      onError: expect.any(Function),
      onFatal: expect.any(Function),
      onMessage: expect.any(Function),
      onOpen: expect.any(Function),
    });

    const { onOpen } = mockWebsocket.mock.calls[0][0];

    onOpen();
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith('set_handler');

    expect(mockOnFocused).toHaveBeenCalledTimes(1);

    const handler = mockOnFocused.mock.calls[0][0];

    handler();
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenCalledWith('set_handler');
  });

  test('onMessage', async () => {
    aiExtension.init();
    expect(mockWebsocket).toHaveBeenCalledWith({
      method: 'push-studio',
      onError: expect.any(Function),
      onFatal: expect.any(Function),
      onMessage: expect.any(Function),
      onOpen: expect.any(Function),
    });

    const { onMessage } = mockWebsocket.mock.calls[0][0];

    await onMessage({
      layerData: '{"layer1": {"name": "layer1", "speed": "10", "power": "20"}}',
      svg: 'svg',
    });
    expect(mockImportSvg).toHaveBeenCalledTimes(1);
    expect(mockImportSvg).toHaveBeenCalledWith(new Blob(['svg'], { type: 'text/plain' }), {
      importType: 'layer',
    });
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'speed', 10);
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'power', 20);
    expect(mockInitState).toHaveBeenCalledTimes(1);
  });
});
