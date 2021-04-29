import binomialCoefficient from 'helpers/math/binomial-coefficient';

const fromBinomialCoef = (n: number, multiplier: number): number[][] => {
  const binomailCoef = binomialCoefficient(n);
  const matrix: number[][] = new Array(n + 1);
  const sum = 2 ** (2 * n);
  for (let i = 0; i < matrix.length; i += 1) {
    matrix[i] = binomailCoef.map((j) => (j * binomailCoef[i] * multiplier) / sum);
  }
  return matrix;
};

export default {
  fromBinomialCoef,
};
