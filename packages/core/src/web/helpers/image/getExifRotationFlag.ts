// Get exif rotation data
// ref: https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side
const getExifRotationFlag = (arrayBuffer): number => {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0, false) !== 0xffd8) {
    return -2;
  }
  const length = view.byteLength;
  let offset = 2;
  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return -1;
    const marker = view.getUint16(offset, false);
    offset += 2;
    if (marker === 0xffe1) {
      // eslint-disable-next-line no-cond-assign
      if (view.getUint32((offset += 2), false) !== 0x45786966) {
        return -1;
      }
      const little = view.getUint16((offset += 6), false) === 0x4949;
      offset += view.getUint32(offset + 4, little);
      const tags = view.getUint16(offset, little);
      offset += 2;
      for (let i = 0; i < tags; i += 1) {
        if (view.getUint16(offset + i * 12, little) === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, little);
        }
      }
    // eslint-disable-next-line no-bitwise
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }
  return -1;
};

export default getExifRotationFlag;
