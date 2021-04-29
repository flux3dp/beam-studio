import gaussianMatrix from './gaussian-matrix';

test('test gaussian matix', () => {
  const res = gaussianMatrix.fromBinomialCoef(2, 16);
  expect(res).toEqual([
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ]);
});
