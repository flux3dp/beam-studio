/* eslint-disable import/first */
const get = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
}));

import DeviceList from './device-list';

test('test device-list', () => {
  get.mockReturnValueOnce('unwanted1,unwanted2');
  expect(DeviceList({
    '1.1.1.1': { name: 'unwanted1' } as any,
    '2.2.2.2': { name: 'unwanted2' } as any,
    '3.3.3.3': { name: 'wanted' } as any,
  })).toEqual([{ name: 'wanted' }]);
  expect(get).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenNthCalledWith(1, 'black-list');

  get.mockReturnValueOnce(undefined);
  expect(DeviceList({
    '1.1.1.1': { name: 'wanted1' } as any,
    '2.2.2.2': { name: 'wanted2' } as any,
    '3.3.3.3': { name: 'wanted3' } as any,
  })).toEqual([{ name: 'wanted1' }, { name: 'wanted2' }, { name: 'wanted3' }]);
});
