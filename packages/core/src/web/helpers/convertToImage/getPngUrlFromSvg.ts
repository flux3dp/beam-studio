const MAX_CANVAS_SIDE = 16384;

export const getPngUrlFromSvg = async (
  svgElement: SVGGraphicsElement,
  { img, scale = 1 }: { img?: HTMLImageElement; scale?: number } = {},
): Promise<string> => {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  const pngUrl = await new Promise<string>((resolve, reject) => {
    const image = img ?? new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    image.onload = () => {
      if (ctx) {
        // browsers blank the canvas past ~16384px per side; clamp instead of failing silently
        const safeScale = Math.min(scale, MAX_CANVAS_SIDE / Math.max(image.naturalWidth, image.naturalHeight));

        canvas.width = Math.round(image.naturalWidth * safeScale);
        canvas.height = Math.round(image.naturalHeight * safeScale);

        console.log(canvas.width, canvas.height);
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
