import round from './round';

describe('test round', () => {
  it('should round to 0 decimal places', () => {
    expect(round(1.2345)).toBe(1);
  });

  it('should round to 1 decimal places', () => {
    expect(round(1.2345, 1)).toBe(1.2);
  });

  it('should round to 2 decimal places', () => {
    expect(round(1.2345, 2)).toBe(1.23);
  });

  it('should return original value if precision is lesser than 0', () => {
    expect(round(1.2345, -1)).toBe(1.2345);
  });
});
