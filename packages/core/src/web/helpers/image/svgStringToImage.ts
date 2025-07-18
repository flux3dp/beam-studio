export const svgStringToImage = async (svgString: string, width: number, height: number): Promise<HTMLImageElement> => {
  const tempCanvas = document.createElement('canvas');

  tempCanvas.width = width;
  tempCanvas.height = height;

  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  const svgUrl = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svgString)}`;
  const img = new Image();

  await new Promise((resolve, reject) => {
    try {
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(tempCanvas);
      };
    } catch (error) {
      reject(error);
    }
    img.src = svgUrl;
  });

  return img;
};

export default svgStringToImage;
