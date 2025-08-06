export const getPngUrlFromSvg = async (
  svgElement: SVGGraphicsElement,
  { img }: { img?: HTMLImageElement } = {},
): Promise<string> => {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  const pngUrl = await new Promise<string>((resolve, reject) => {
    const image = img ?? new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    image.onload = () => {
      if (ctx) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        // Export the canvas content as a PNG data URL
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get 2D context from canvas.'));
      }
    };
    image.onerror = () => {
      reject(new Error('Failed to load the combined SVG for rasterization.'));
    };
    image.src = svgUrl;
  });

  return pngUrl;
};
