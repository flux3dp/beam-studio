export default function binomialCoefficient(n: number): number[] {
  const res: number[] = new Array(n + 1).fill(1);
  let current = 1;
  for (let i = 1; i <= n; i += 1) {
    if (i <= n / 2) {
      current = (current * (n - i + 1)) / i;
      res[i] = current;
    } else {
      res[i] = res[n - i];
    }
  }
  return res;
}
