import parseQueryData from './query-data-parser';

test('test query-data-parser', () => {
  expect(parseQueryData('access_token=abcde&code=12345&id=xyz')).toEqual({
    access_token: 'abcde',
    code: '12345',
    id: 'xyz',
  });
});
