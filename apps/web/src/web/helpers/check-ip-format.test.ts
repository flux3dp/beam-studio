import checkIPFormat from './check-ip-format';

describe('test checkIPFormat', () => {
  it('should work', () => {
    expect(checkIPFormat('192.168.1.44')).toBeTruthy();
    expect(checkIPFormat('0.0.0.0')).toBeTruthy();
    expect(checkIPFormat('192.168.1.256')).toBeFalsy();
    expect(checkIPFormat('192.168.1.255.12')).toBeFalsy();
  });
});
