const round = (value: number, precision = 0): number => {
  if (precision < 0) return value;
  if (precision === 0) return Math.round(value);
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
};

export default round;
