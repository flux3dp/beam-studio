export function binarySearchIndex(array: number[], target: number): number {
  const { length } = array;
  let [start, end] = [0, length - 1];

  if (target <= array[start]) return start;

  if (target >= array[end]) return end;

  while (start <= end) {
    const mid = ~~(start + ((end - start) >> 1));
    const midVal = array[mid];

    if (midVal === target) return mid;

    if (midVal <= target) start = mid + 1;
    else end = mid - 1;
  }

  if (end === length - 1) return end;

  return array[end + 1] + array[end] > 2 * target ? end : end + 1;
}
