import socialAuth from './social-auth';

describe('test social-auth', () => {
  test('result is true', () => {
    window.close = jest.fn();
    socialAuth(true);

    expect(window.close).toHaveBeenCalledTimes(1);
  });

  test('result is false', () => {
    window.close = jest.fn();
    socialAuth(false);
    expect(window.close).not.toHaveBeenCalled();
  });
});
