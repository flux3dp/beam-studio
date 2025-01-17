import isJson from './is-json';

test('test is-json', () => {
  expect(isJson('{"name":"flux","url":"https://www.flux3dp.com"}')).toBeTruthy();
  expect(isJson('{"name":"flux,"url":"https://www.flux3dp.com"}')).toBeFalsy();
});
