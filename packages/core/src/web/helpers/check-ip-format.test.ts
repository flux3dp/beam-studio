import checkIPFormat from './check-ip-format';

describe('test checkIPFormat', () => {
  it('should work', () => {
    expect(checkIPFormat('192.168.1.44')).toBeTruthy();
    expect(checkIPFormat('0.0.0.0')).toBeTruthy();
    expect(checkIPFormat('192.168.1.256')).toBeFalsy();
    expect(checkIPFormat('192.168.1.255.12')).toBeFalsy();
    expect(checkIPFormat('192.168.100.1')).toBeTruthy();
  });

  it('should reject invalid formats', () => {
    expect(checkIPFormat('192.168.1')).toBeFalsy();
    expect(checkIPFormat('abc.def.gha.bcd')).toBeFalsy();
    expect(checkIPFormat('1234.567.89.0')).toBeFalsy();
    expect(checkIPFormat('...')).toBeFalsy();
    expect(checkIPFormat('256.256.256.256')).toBeFalsy();
    expect(checkIPFormat('192168011')).toBeFalsy();
  });
});
