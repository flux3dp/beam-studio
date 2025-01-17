/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/first */
const storageGet = jest.fn();
const set = jest.fn();
jest.mock('implementations/storage', () => ({
  get: storageGet,
  set,
}));

import i18n from './i18n';

test('test i18n', () => {
  storageGet.mockReturnValue(undefined);
  expect(i18n.getActiveLang()).toBe('en');

  storageGet.mockReturnValue('zh-tw');
  expect(i18n.getActiveLang()).toBe('zh-tw');

  i18n.setActiveLang('en');
  expect(set).toHaveBeenCalledTimes(1);
  expect(set).toHaveBeenNthCalledWith(1, 'active-lang', 'en');

  expect(i18n.lang.topbar.untitled).toBe('Untitled');
});
