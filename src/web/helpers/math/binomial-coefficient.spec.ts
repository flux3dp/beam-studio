import binomialCoefficient from './binomial-coefficient';

test('test binomial coefficient', () => {
  const result = binomialCoefficient(4);
  expect(result).toEqual([1, 4, 6, 4, 1]);
});
