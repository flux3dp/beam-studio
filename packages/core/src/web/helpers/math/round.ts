import { round as rRound } from 'remeda';

const round = (value: number, precision = 0): number => {
  return rRound(value, precision);
};

export default round;
