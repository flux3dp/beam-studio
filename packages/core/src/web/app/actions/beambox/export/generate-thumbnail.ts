import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import workareaManager from '@core/app/svgedit/workarea';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

const { $ } = window;

let svgedit;

getSVGAsync((globalSVG) => {
  svgedit = globalSVG.Edit;
});

const fetchThumbnail = async (): Promise<string[]> => {
  function cloneAndModifySvg($svg) {
    const $clonedSvg = $svg.clone(false);

    $clonedSvg.find('text').remove();
    $clonedSvg.find('#selectorParentGroup').remove();
    $clonedSvg.find('#canvasBackground #previewSvg').remove();
    $clonedSvg.find('#canvasBackground #previewBoundary').remove();
    $clonedSvg.find('#canvasBackground #guidesLines').remove();
    $clonedSvg.find('#canvasBackground #workarea-boundary').remove();
    $clonedSvg.find('#canvasBackground').css('overflow', 'visible');
    $clonedSvg.find('#canvasBackground').children().css('overflow', 'visible');

    return $clonedSvg;
  }

  async function DOM2Image($svg) {
    const $modifiedSvg = cloneAndModifySvg($svg);
    const svgString = new XMLSerializer().serializeToString($modifiedSvg.get(0));

    const image = await new Promise((resolve) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svgString)}`;
    });

    return image;
  }

  function cropAndDrawOnCanvas(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (beamboxPreference.read('crop-task-thumbnail')) {
      const { maxY, minY, width } = workareaManager;
      const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
      let x = Number.parseFloat(svgContent.getAttribute('x') ?? '0');
      let y = Number.parseFloat(svgContent.getAttribute('y') ?? '0');
      let w = Number.parseFloat(svgContent.getAttribute('width') ?? '0');
      const ratio = w / width;
      const bbox = svgContent.getBBox();
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
      const ratio = img.width / $('#svgroot').width();
      const W = ratio * $('#svgroot').width();
      const H = ratio * $('#svgroot').height();
      const w = ratio * Number.parseFloat($('#canvasBackground').attr('width'));
      const h = ratio * Number.parseFloat($('#canvasBackground').attr('height'));
      const offsetY = ratio * Number.parseFloat($('#canvasBackgroundRect').attr('y'));
      const x = -(W - w) / 2;
      const y = -(H - h) / 2 - offsetY;

      canvas.width = Math.min(w, 500);
      canvas.height = Math.ceil(h * (canvas.width / w));

      ctx.drawImage(img, -x, -y, w, h, 0, 0, canvas.width, canvas.height);
    }

    return canvas;
  }

  const $svg = cloneAndModifySvg($('#svgroot'));
  const img = await DOM2Image($svg);
  const canvas = cropAndDrawOnCanvas(img);

  const urls = await new Promise<string[]>((resolve) => {
    canvas.toBlob((blob) => {
      resolve([canvas.toDataURL(), URL.createObjectURL(blob)]);
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
