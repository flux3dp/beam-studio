const stepRangeGenerator = (start: number, end: number, step: number): number[] => {
  const range = [];
  for (let i = start; i < end; i += step) {
    range.push(i);
  }
  range.push(end);
  return range;
};

const countRangeGenerator = (start: number, end: number, count: number): number[] => {
  const range = [];
  const step = Math.round(((end - start) / (count - 1)) * 100) / 100;
  for (let i = 0; i < count - 1; i += 1) {
    range.push(start + step * i);
  }
  range.push(end);
  return range;
};

// TODO: Add unit tests
export default {
  stepRangeGenerator,
  countRangeGenerator,
};
