/* eslint-disable import/first */
/* eslint-disable no-var */

var mockSet = jest.fn();
var mockGet = jest.fn();
var mockRemoveAt = jest.fn();

jest.mock('helpers/storage-helper', () => ({
  set: mockSet,
  get: mockGet,
  removeAt: mockRemoveAt,
}));

import Config from './config';

test('test config', () => {
  const config = Config();
  const callback = jest.fn();

  config.write('name', 'flux', {
    onFinished: callback,
  });
  expect(mockSet).toHaveBeenCalledTimes(1);
  expect(mockSet).toHaveBeenNthCalledWith(1, 'name', 'flux');
  expect(callback).toHaveBeenCalledTimes(1);

  mockGet.mockReturnValue('flux');
  const value = config.read('name', {
    onFinished: callback,
  });
  expect(mockGet).toHaveBeenCalledTimes(1);
  expect(mockGet).toHaveBeenNthCalledWith(1, 'name');
  expect(callback).toHaveBeenCalledTimes(2);
  expect(value).toBe('flux');

  config.remove('name');
  expect(mockRemoveAt).toHaveBeenCalledTimes(1);
  expect(mockRemoveAt).toHaveBeenNthCalledWith(1, 'name');
});
