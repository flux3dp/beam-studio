const mockGet = jest.fn();

jest.mock('@app/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

import DeviceList from './device-list';

test('test device-list', () => {
  mockGet.mockReturnValueOnce('unwanted1,unwanted2');

  expect(
    DeviceList({
      '1.1.1.1': { name: 'unwanted1' } as any,
      '2.2.2.2': { name: 'unwanted2' } as any,
      '3.3.3.3': { name: 'wanted' } as any,
    }),
  ).toEqual([{ name: 'wanted' }]);

  expect(mockGet).toHaveBeenCalledTimes(1);
  expect(mockGet).toHaveBeenNthCalledWith(1, 'black-list');

  mockGet.mockReturnValueOnce(undefined);
  expect(
    DeviceList({
      '1.1.1.1': { name: 'wanted1' } as any,
      '2.2.2.2': { name: 'wanted2' } as any,
      '3.3.3.3': { name: 'wanted3' } as any,
    }),
  ).toEqual([{ name: 'wanted1' }, { name: 'wanted2' }, { name: 'wanted3' }]);
});
