onmessage = async (e) => {
  const startTime = performance.now();

  if (!e?.data?.type) return;

  const { type } = e.data;

  if (type === 'svgStringToBlob') {
    const { svgString } = e.data;
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });

    postMessage(svgBlob);
  } else if (type === 'imageDataToBlob') {
    const { bb, imageData, imageRatio } = e.data;
    const imgCanvas = new OffscreenCanvas(imageData.width, imageData.height);
    const imgCtx = imgCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

    imgCtx.imageSmoothingEnabled = false;
    imgCtx.putImageData(imageData, 0, 0);

    const outCanvas = new OffscreenCanvas(Math.max(1, bb.width * imageRatio), Math.max(1, bb.height * imageRatio));
    const outCtx = outCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(
      imgCanvas,
      bb.x * imageRatio,
      bb.y * imageRatio,
      outCanvas.width,
      outCanvas.height,
      0,
      0,
      outCanvas.width,
      outCanvas.height,
    );

    const imageBlob = await outCanvas.convertToBlob({ type: 'image/png' });

    postMessage(imageBlob);
  }

  console.log('image-symbol.worker operationTime', performance.now() - startTime);
};
