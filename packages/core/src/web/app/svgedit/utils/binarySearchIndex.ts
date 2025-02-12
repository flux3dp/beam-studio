export function binarySearchIndex(array: number[], target: number): number {
  const { length } = array;
  let [start, end] = [0, length - 1];

  if (target <= array[start]) return start;
  else if (target >= array[end]) return end;

  while (start <= end) {
    const mid = Math.floor(start + (end - start) / 2);
    const midVal = array[mid];

    if (midVal === target) return mid;
    else if (midVal < target) start = mid + 1;
    else end = mid - 1;
  }

  return array[start] - target < target - array[end] ? start : end;
}

export function binarySearchLowerBoundIndex(array: number[], target: number): number {
  const { length } = array;
  let [start, end] = [0, length - 1];

  if (target <= array[start]) return start;
  else if (target >= array[end]) return end;

  while (start < end) {
    const mid = Math.floor(start + (end - start) / 2);
    const midVal = array[mid];

    if (midVal === target) return mid;
    else if (midVal < target) start = mid + 1;
    else end = mid;
  }

  return start;
}
