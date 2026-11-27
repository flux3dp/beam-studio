const mockConnectWebSocket = jest.fn();

jest.mock('@core/helpers/sslIpHelper', () => ({
  connectWebSocket: (...args: any[]) => mockConnectWebSocket(...args),
}));

// only used for the backend error alert; its imports reach the api clients, which open sockets on load
jest.mock('@core/helpers/error-report/consent', () => ({}));

import Websocket from './websocket';

const fakeSocket = () => ({ close: jest.fn(), readyState: WebSocket.OPEN, send: jest.fn() });

describe('websocket close(false)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.setItem('port', '8000');
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.removeItem('port');
  });

  test('drops a handshake still in progress: nothing queued is sent and no ping follows', () => {
    const ws = Websocket({ method: 'camera-calibration' });
    const { onSettled } = mockConnectWebSocket.mock.calls[0][0];

    ws.send('update_data {}');
    ws.close(false);

    const socket = fakeSocket();

    onSettled(socket, new Event('open'));
    jest.advanceTimersByTime(2 * 60 * 1000);

    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(socket.send).not.toHaveBeenCalled();
  });

  test('still sends what was queued once the handshake ends when left open', () => {
    const ws = Websocket({ method: 'camera-calibration' });
    const { onSettled } = mockConnectWebSocket.mock.calls[0][0];

    ws.send('update_data {}');

    const socket = fakeSocket();

    onSettled(socket, new Event('open'));

    expect(socket.send).toHaveBeenCalledWith('update_data {}');
    expect(socket.close).not.toHaveBeenCalled();
  });
});
