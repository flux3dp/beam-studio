import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

let svgedit;

getSVGAsync((globalSVG) => {
  svgedit = globalSVG.Edit;
});

const fetchThumbnail = async (): Promise<string[]> => {
  const cropTaskThumbnail = useGlobalPreferenceStore.getState()['crop-task-thumbnail'];

  function cloneAndModifySvg(svg: SVGSVGElement) {
    const clonedSvg = svg.cloneNode(true) as unknown as SVGSVGElement;

    clonedSvg.querySelectorAll('text').forEach((text) => text.remove());
    clonedSvg.querySelector('#selectorParentGroup')?.remove();
    clonedSvg.querySelector('#canvasBackground #previewSvg')?.remove();
    clonedSvg.querySelector('#canvasBackground #previewBoundary')?.remove();
    clonedSvg.querySelector('#canvasBackground #guidesLines')?.remove();
    clonedSvg.querySelector('#canvasBackground #workarea-boundary')?.remove();

    const canvasBackground = clonedSvg.querySelector('#canvasBackground');

    if (canvasBackground) {
      canvasBackground.setAttribute('overflow', 'visible');
      Array.from(canvasBackground.children).forEach((child) => {
        child.setAttribute('overflow', 'visible');
      });
    }

    return clonedSvg;
  }

  async function DOM2Image(svg: SVGSVGElement) {
    const modifiedSvg = cloneAndModifySvg(svg);
    const svgString = modifiedSvg.outerHTML;

    const image = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svgString)}`;
    });

    return image;
  }

  function cropAndDrawOnCanvas(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (cropTaskThumbnail) {
      const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
      const fullResolutionCanvas = document.createElement('canvas');
      const fullResolutionCtx = fullResolutionCanvas.getContext('2d')!;
      const { height, width } = workareaManager;
      const displayW = Number.parseFloat(svgContent.getAttribute('width') ?? '0');

      fullResolutionCanvas.width = width;
      fullResolutionCanvas.height = height;
      fullResolutionCtx.drawImage(img, 0, 0, width, height);

      let [left, top, right, bottom] = [-1, -1, -1, -1];
      const imageData = fullResolutionCtx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          if (data[idx + 3] > 0) {
            if (left === -1 || x < left) left = x;

            if (top === -1 || y < top) top = y;

            if (right === -1 || x > right) right = x;

            if (bottom === -1 || y > bottom) bottom = y;
          }
        }
      }

      const padding = 100;

      left = left === -1 ? 0 : Math.max(left - padding, 0);
      top = top === -1 ? 0 : Math.max(top - padding, 0);
      right = right === -1 ? width : Math.min(right + padding, width);
      bottom = bottom === -1 ? height : Math.min(bottom + padding, height);

      const canvasW = right - left;
      const canvasH = bottom - top;
      const ratio = displayW / width;

      canvas.width = Math.min(canvasW * ratio, 500);
      canvas.height = Math.ceil(canvasH * (canvas.width / canvasW));
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fullResolutionCanvas, left, top, canvasW, canvasH, 0, 0, canvas.width, canvas.height);
    } else {
      const svgRoot = document.getElementById('svgroot')! as unknown as SVGSVGElement;
      const rootWidth = Number.parseFloat(svgRoot.getAttribute('width') ?? '0');
      const rootHeight = Number.parseFloat(svgRoot.getAttribute('height') ?? '0');
      const ratio = img.width / rootWidth;
      const W = ratio * rootWidth;
      const H = ratio * rootHeight;
      const canvasBackground = document.getElementById('canvasBackground')!;
      const canvasBackgroundRect = document.getElementById('canvasBackgroundRect')!;
      const w = ratio * Number.parseFloat(canvasBackground.getAttribute('width') ?? '0');
      const h = ratio * Number.parseFloat(canvasBackground.getAttribute('height') ?? '0');
      const offsetY = ratio * Number.parseFloat(canvasBackgroundRect.getAttribute('y') ?? '0');
      const x = -(W - w) / 2;
      const y = -(H - h) / 2 - offsetY;

      canvas.width = Math.min(w, 500);
      canvas.height = Math.ceil(h * (canvas.width / w));

      ctx.drawImage(img, -x, -y, w, h, 0, 0, canvas.width, canvas.height);
    }

    return canvas;
  }

  const svg = cloneAndModifySvg(
    document.getElementById(cropTaskThumbnail ? 'svgcontent' : 'svgroot') as unknown as SVGSVGElement,
  );
  const img = await DOM2Image(svg);
  const canvas = cropAndDrawOnCanvas(img);

  const urls = await new Promise<string[]>((resolve) => {
    canvas.toBlob((blob) => {
      resolve([canvas.toDataURL(), URL.createObjectURL(blob!)]);
    });
  });

  return urls;
};

const generateThumbnail = async (): Promise<{
  thumbnail: string;
  thumbnailBlobURL: string;
}> => {
  svgedit.utilities.moveDefsIntoSvgContent();

  const [thumbnail, thumbnailBlobURL] = await fetchThumbnail();

  svgedit.utilities.moveDefsOutfromSvgContent();

  return { thumbnail, thumbnailBlobURL };
};

export default generateThumbnail;
