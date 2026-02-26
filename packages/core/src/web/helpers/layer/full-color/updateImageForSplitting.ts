import exifr from 'exifr';

// for rgb image, we need to transform it to cmyk
// for cmyk images we need to update the image data
const updateImageForSplitting = async (layerElement: SVGGElement): Promise<void> => {
  const images = layerElement.querySelectorAll('image');

  for (let i = 0; i < images.length; i += 1) {
    const image = images[i];
    const origImage = image.getAttribute('origImage');
    let exifrData;

    try {
      exifrData = await exifr.parse(origImage, { icc: true, tiff: { multiSegment: true } });
    } catch (e) {
      console.error('Failed to parse exif data', e);
    }

    if (exifrData?.ColorSpaceData === 'CMYK') {
      image.setAttribute('cmyk', '1');
    }
  }
};

export default updateImageForSplitting;
