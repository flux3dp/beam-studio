let userAgentGetter: jest.SpyInstance;

describe('test getBrowser', () => {
  beforeEach(() => {
    userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    jest.resetModules();
  });

  test('test Chrome', () => {
    const { getBrowser } = require('./browser');

    userAgentGetter.mockReturnValue(
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    );
    expect(getBrowser()).toBe('Chrome');
  });

  test('test Edge', () => {
    const { getBrowser } = require('./browser');

    userAgentGetter.mockReturnValue('Mozilla/5.0 Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0');
    expect(getBrowser()).toBe('Edge');
  });

  test('test Firefox', () => {
    const { getBrowser } = require('./browser');

    userAgentGetter.mockReturnValue('Firefox');
    expect(getBrowser()).toBe('Firefox');
  });
});
