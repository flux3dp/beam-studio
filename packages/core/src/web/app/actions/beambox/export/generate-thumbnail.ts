import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import { getSvgContentActualBBox } from '@core/helpers/file/export/utils/getBBox';

const fetchThumbnail = async (): Promise<string[]> => {
  function cloneAndModifySvg(svg: SVGSVGElement) {
    const defs = findDefs();
    const clonedSvg = svg.cloneNode(true) as unknown as SVGSVGElement;

    clonedSvg.appendChild(defs.cloneNode(true));
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

  async function cropAndDrawOnCanvas(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (useGlobalPreferenceStore.getState()['crop-task-thumbnail']) {
      const { maxY, minY, width } = workareaManager;
      const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
      let x = Number.parseFloat(svgContent.getAttribute('x') ?? '0');
      let y = Number.parseFloat(svgContent.getAttribute('y') ?? '0');
      let w = Number.parseFloat(svgContent.getAttribute('width') ?? '0');
      const ratio = w / width;
      const bbox = await getSvgContentActualBBox(false);
      const padding = 100;
      let right = bbox.x + bbox.width + padding;
      let bottom = bbox.y + bbox.height + padding;

      bbox.x -= padding;
      bbox.y -= padding;

      if (bbox.x < 0) bbox.x = 0;

      if (right > width) right = width;

      if (bbox.y < minY) bbox.y = minY;

      if (bottom > maxY) bottom = maxY;

      bbox.width = right - bbox.x;
      bbox.height = bottom - bbox.y;
      x += bbox.x * ratio;
      y += bbox.y * ratio;
      w = bbox.width * ratio;

      const h = bbox.height * ratio;

      canvas.width = Math.min(w, 500);
      canvas.height = Math.ceil(h * (canvas.width / w));
      ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
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

  const svg = cloneAndModifySvg(document.getElementById('svgroot') as unknown as SVGSVGElement);
  const img = await DOM2Image(svg);
  const canvas = await cropAndDrawOnCanvas(img);

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
  const [thumbnail, thumbnailBlobURL] = await fetchThumbnail();

  return { thumbnail, thumbnailBlobURL };
};

export default generateThumbnail;
