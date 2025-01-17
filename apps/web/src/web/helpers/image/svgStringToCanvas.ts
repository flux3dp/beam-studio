const svgStringToCanvas = (
  svgString: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement> => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  const svgUrl = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svgString)}`;
  const img = new Image();
  return new Promise((resolve, reject) => {
    try {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(tempCanvas);
      };
    } catch (error) {
      reject(error);
    }
    img.src = svgUrl;
  });
};

export default svgStringToCanvas;
