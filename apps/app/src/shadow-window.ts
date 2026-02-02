import electron from 'electron';

import { SvgEvents } from '@core/app/constants/ipcEvents';

const main = async () => {
  const { ipcRenderer: ipc } = electron;

  ipc.on(SvgEvents.SvgUrlToImgUrl, (e, data) => {
    const { fullColor, height, id, senderId, strokeWidth, url, width } = data;
    const img = new Image(width + Number.parseInt(strokeWidth, 10), height + Number.parseInt(strokeWidth, 10));

    img.onload = async () => {
      const imgCanvas = document.createElement('canvas');

      imgCanvas.width = img.width;
      imgCanvas.height = img.height;

      const ctx = imgCanvas.getContext('2d') as CanvasRenderingContext2D;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);

      const outCanvas = document.createElement('canvas');

      outCanvas.width = Math.max(1, width);
      outCanvas.height = Math.max(1, height);

      const outCtx = outCanvas.getContext('2d') as CanvasRenderingContext2D;

      outCtx.imageSmoothingEnabled = false;

      if (!fullColor) {
        outCtx.filter = 'brightness(0%)';
      }

      outCtx.drawImage(imgCanvas, 0, 0, outCanvas.width, outCanvas.height);

      const imageBase64 = outCanvas.toDataURL('image/png');
      const res = await fetch(imageBase64);
      const imageBlob = await res.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      ipc.send(SvgEvents.SvgUrlToImgUrlDone, { id, imageUrl, senderId });
    };

    img.onerror = (error) => {
      console.error('Failed to load SVG image for conversion:', url, error);
    };

    img.src = url;
  });
};

main();
