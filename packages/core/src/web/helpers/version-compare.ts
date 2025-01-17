const padArrayWithZero = (arr: string[], length: number): string[] => {
  while (arr.length < length) {
    arr.push('0');
  }
  return arr;
};

export default (current: string, promoted: string): boolean => {
  const currVer = current || '0.0.0';
  const promoteVer = promoted || '0.0.0';

  if (currVer === promoteVer) {
    return false;
  }

  let currVerArr = currVer.split('.');
  let promoteVerArr = promoteVer.split('.');

  const len = Math.max(currVerArr.length, promoteVerArr.length);

  currVerArr = padArrayWithZero(currVerArr, len);
  promoteVerArr = padArrayWithZero(promoteVerArr, len);

  for (let i = 0; i < len; i += 1) {
    const proVal = parseFloat(promoteVerArr[i]);
    const curVal = parseFloat(currVerArr[i]);
    if (proVal < curVal) {
      return false;
    }
    if (proVal > curVal) {
      return true;
    }
  }
  return false;
};
