import isWeb from './is-web';

describe('isWeb', () => {
  it('should work', () => {
    window.FLUX.version = 'web-0.01';
    expect(isWeb()).toBe(true);
    window.FLUX.version = '2.0.0-beta';
    expect(isWeb()).toBe(false);
  });
});
