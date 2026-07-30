import getOpenCV from '@core/helpers/api/open-cv';

import { markRadiusPx } from '../constants';

/**
 * Detect the printed alignment marks in an image with the fluxghost blob
 * detector, using the shared size/circularity window around the printed mark
 * size. Kept in one place so the smart sweep and the background detection can
 * never drift apart.
 * @param blob the image
 * @param ratio image px per workarea canvas px
 * @returns blob centers in the image's own px; callers map them back to
 * canvas coordinates with their crop origin and `ratio`
 */
export const detectMarkBlobs = async (blob: Blob, ratio: number): Promise<Array<[number, number]>> => {
  const markRadiusOnImage = markRadiusPx * ratio;

  console.log('ratio', ratio, 'markRadiusOnImage', markRadiusOnImage);

  const markArea = Math.PI * markRadiusOnImage ** 2;
  const { points } = await getOpenCV().detectBlobs(blob, {
    max_area: markArea * 1.3,
    min_area: markArea * 0.7,
    min_circularity: 0.7,
  });

  return points;
};
