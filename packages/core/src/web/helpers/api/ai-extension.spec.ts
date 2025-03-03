const mockImportSvg = jest.fn();

jest.mock('@core/app/svgedit/operations/import/importSvg', () => mockImportSvg);

const mockWebsocket = jest.fn();

jest.mock('@core/helpers/websocket', () => mockWebsocket);

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeData: mockWriteData,
}));

import aiExtension from './ai-extension';

test('ai-extension', async () => {
  aiExtension.init();
  expect(mockWebsocket).toBeCalledWith({
    method: 'push-studio',
    onError: expect.any(Function),
    onFatal: expect.any(Function),
    onMessage: expect.any(Function),
  });

  const { onMessage } = mockWebsocket.mock.calls[0][0];

  await onMessage({
    layerData: '{"layer1": {"name": "layer1", "speed": "10", "power": "20"}}',
    svg: 'svg',
  });
  expect(mockImportSvg).toBeCalledTimes(1);
  expect(mockImportSvg).toBeCalledWith(new Blob(['svg'], { type: 'text/plain' }), {
    isFromAI: true,
  });
  expect(mockWriteData).toBeCalledTimes(2);
  expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'speed', 10);
  expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'power', 20);
});
