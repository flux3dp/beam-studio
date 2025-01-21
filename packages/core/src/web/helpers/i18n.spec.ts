// Define mock functions at the top
const mockGet = jest.fn();
const mockSet = jest.fn();

// Use jest.doMock to mock the modules after defining the mock functions
jest.mock('@app/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
}));

// Import the module to be tested
import i18n from './i18n';

test('test i18n', () => {
  // Mock the return value of `mockGet`
  mockGet.mockReturnValue(undefined);

  // Test the default language
  expect(i18n.getActiveLang()).toBe('en');
  expect(mockGet).toHaveBeenCalledTimes(2);
  expect(mockGet).toHaveBeenNthCalledWith(2, 'active-lang');

  // Mock the return value of `mockGet` to simulate a different language
  mockGet.mockReturnValue('zh-tw');

  // Test the updated language
  expect(i18n.getActiveLang()).toBe('zh-tw');

  // Test setting a new language
  i18n.setActiveLang('en');

  // Verify that `mockSet` was called correctly
  expect(mockSet).toHaveBeenCalledTimes(1);
  expect(mockSet).toHaveBeenNthCalledWith(1, 'active-lang', 'en');

  // Test a translation
  expect(i18n.lang.topbar.untitled).toBe('Untitled');
});
