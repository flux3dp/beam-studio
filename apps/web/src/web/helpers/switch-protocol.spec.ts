import switchProtocol from './switch-protocol';

jest.mock('./is-web', () => () => true);

describe('test switchProtocol', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
      },
      writable: true,
    });
  });

  test('test switch to https', () => {
    window.location.href = 'http://localhost:3000/';
    switchProtocol();
    expect(window.location.href).toBe('https://localhost:3000/');
  });

  test('test switch to http', () => {
    window.location.href = 'http://localhost:3000/';
    switchProtocol('http:');
    expect(window.location.href).toBe('http://localhost:3000/');
  });

  test('test switch to https when current is https', () => {
    window.location.href = 'https://localhost:3000/';
    switchProtocol();
    expect(window.location.href).toBe('http://localhost:3000/');
  });

  test('test switch to http when current is https', () => {
    window.location.href = 'https://localhost:3000/';
    switchProtocol('https:');
    expect(window.location.href).toBe('https://localhost:3000/');
  });
});
