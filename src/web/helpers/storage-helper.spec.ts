import StorageHelper from './storage-helper';

test('test storage-helper', () => {
  StorageHelper.set('name', 'flux');
  StorageHelper.set('address', '台北市南港區重陽路 459 號 7 樓');
  StorageHelper.set('json', '{"name": "flux","address":"台北市南港區重陽路 459 號 7 樓"}');
  StorageHelper.set('poke-ip-addr', '1.2.3.4');
  expect(StorageHelper.isExisting('name')).toBeTruthy();
  expect(StorageHelper.get('name')).toBe('flux');
  expect(StorageHelper.isExisting('address')).toBeTruthy();
  expect(StorageHelper.get('address')).toBe('台北市南港區重陽路 459 號 7 樓');
  expect(StorageHelper.isExisting('json')).toBeTruthy();
  expect(StorageHelper.get('json')).toEqual({
    name: 'flux',
    address: '台北市南港區重陽路 459 號 7 樓',
  });
  expect(StorageHelper.isExisting('poke-ip-addr')).toBeTruthy();
  expect(StorageHelper.get('poke-ip-addr')).toBe('1.2.3.4');
  expect(StorageHelper.isExisting('phone')).toBeFalsy();

  StorageHelper.removeAt('address');
  expect(StorageHelper.isExisting('address')).toBeFalsy();

  StorageHelper.clearAllExceptIP();
  expect(StorageHelper.isExisting('name')).toBeFalsy();
  expect(StorageHelper.isExisting('address')).toBeFalsy();
  expect(StorageHelper.isExisting('json')).toBeFalsy();
  expect(StorageHelper.isExisting('poke-ip-addr')).toBeTruthy();
  expect(StorageHelper.get('poke-ip-addr')).toBe('1.2.3.4');

  StorageHelper.clearAll();
  expect(StorageHelper.isExisting('poke-ip-addr')).toBeFalsy();
});
