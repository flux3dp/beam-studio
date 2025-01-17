/* eslint-disable no-bitwise */
import exifr from 'exifr';

const DEFAULT_DPMM = 10;
// TODO: add unit test, and support for different file types
const getDpmm = async (arrayBuffer: ArrayBuffer, fileType: string): Promise<number[]> => {
  if (fileType === 'image/png') {
    // https://medium.com/@rodrigo.lpdsilva/determine-the-dpi-of-a-png-file-using-javascript-4c121a97f509
    const bytes = new Uint8Array(arrayBuffer);
    if (
      bytes[0] !== 137 ||
      bytes[1] !== 80 ||
      bytes[2] !== 78 ||
      bytes[3] !== 71 ||
      bytes[4] !== 13 ||
      bytes[5] !== 10 ||
      bytes[6] !== 26 ||
      bytes[7] !== 10
    ) {
      console.log('Invalid PNG file.');
      return [DEFAULT_DPMM, DEFAULT_DPMM];
    }
    let offset = 8;
    let pHYsFound = false;
    let ppmX = 0;
    let ppmY = 0;

    // Parse the PNG header to find the pHYs chunk
    while (offset < bytes.length) {
      const chunkLength =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];
      const chunkType = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      if (chunkType === 'pHYs') {
        ppmX =
          (bytes[offset + 8] << 24) |
          (bytes[offset + 9] << 16) |
          (bytes[offset + 10] << 8) |
          bytes[offset + 11];
        ppmY =
          (bytes[offset + 12] << 24) |
          (bytes[offset + 13] << 16) |
          (bytes[offset + 14] << 8) |
          bytes[offset + 15];
        pHYsFound = true;
        break;
      }
      offset += chunkLength + 12;
    }

    // Check if the pHYs chunk was found
    if (!pHYsFound) {
      console.log('pHYs not found.');
      return [DEFAULT_DPMM, DEFAULT_DPMM];
    }

    return [ppmX / 1000, ppmY / 1000];
  }
  if (fileType === 'image/jpeg') {
    const exifrData = await exifr.parse(arrayBuffer, { jfif: true, tiff: { multiSegment: true } });
    if (exifrData?.XResolution && exifrData?.YResolution) {
      return [exifrData.XResolution / 25.4, exifrData.YResolution / 25.4];
    }
  }
  return [DEFAULT_DPMM, DEFAULT_DPMM];
};

export default getDpmm;
