import { dpmm } from '@core/app/actions/beambox/constant';

export const getBevelFilter = (rampLengthMm: number, imageSize: { height: number; width: number }) => {
  return (imageData: ImageData): void => {
    if (rampLengthMm <= 0) return;

    // Convert mm to pixels (assuming 72 DPI as standard)
    const mmToPixel = dpmm; // 1 mm = 72/25.4 pixels at 72 DPI
    const rampLengthPixels = rampLengthMm * mmToPixel;
    const data = imageData.data;
    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;

    for (let y = 0; y < imageSize.height; y++) {
      for (let x = 0; x < imageSize.width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const index = (y * imageSize.width + x) * 4;

        // Create radial ramp effect
        if (distance <= rampLengthPixels) {
          const rampFactor = distance / rampLengthPixels;

          data[index] = Math.floor(data[index] * rampFactor); // red
          data[index + 1] = Math.floor(data[index + 1] * rampFactor); // green
          data[index + 2] = Math.floor(data[index + 2] * rampFactor); // blue
        } else {
          // Beyond ramp length, make transparent/black
          data[index] = 0; // red
          data[index + 1] = 0; // green
          data[index + 2] = 0; // blue
        }
      }
    }
  };
};
