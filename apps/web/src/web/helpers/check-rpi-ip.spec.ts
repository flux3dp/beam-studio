import checkRpiIp from './check-rpi-ip';

const mockDnsLookUpAll = jest.fn();
jest.mock('implementations/network', () => ({
  dnsLookUpAll: (...args) => mockDnsLookUpAll(...args),
}));

const mockConsoleLog = jest.fn();
describe('test check-rpi-ip', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.console.log = mockConsoleLog;
  });

  it('should return ip if exists', async () => {
    mockDnsLookUpAll.mockResolvedValue([{ family: 4, address: '123.123.123.123' }]);
    const res = await checkRpiIp();
    expect(res).toBe('123.123.123.123');
    expect(mockDnsLookUpAll).toBeCalledTimes(1);
    expect(mockDnsLookUpAll).toHaveBeenLastCalledWith('raspberrypi.local');
  });

  it('should return null if no matched result', async () => {
    mockDnsLookUpAll.mockResolvedValue([]);
    const res = await checkRpiIp();
    expect(res).toBe(null);
    expect(mockDnsLookUpAll).toBeCalledTimes(1);
    expect(mockDnsLookUpAll).toHaveBeenLastCalledWith('raspberrypi.local');
  });

  it('should return null when error occur', async () => {
    mockDnsLookUpAll.mockRejectedValue(new Error('ENOTFOUND'));
    const res = await checkRpiIp();
    expect(res).toBe(null);
    expect(mockDnsLookUpAll).toBeCalledTimes(1);
    expect(mockDnsLookUpAll).toHaveBeenLastCalledWith('raspberrypi.local');
    expect(mockConsoleLog).toBeCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenLastCalledWith('DNS server not found raspberrypi.local');
  });
});
