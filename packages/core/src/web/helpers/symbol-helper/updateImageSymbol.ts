import { Subject } from 'rxjs';
import { filter, map, mergeMap, scan } from 'rxjs/operators';

import { SvgEvents } from '@core/app/constants/ipcEvents';
import findDefs from '@core/app/svgedit/utils/findDef';
import communicator from '@core/implementations/communicator';

import { getBrowser } from '../browser';
import isWeb from '../is-web';

interface BoundingBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface UpdateImageSymbolParams {
  bb: BoundingBox;
  fullColor: boolean;
  imageRatio: number;
  imageSymbol: SVGSymbolElement;
  strokeWidth: number;
  svgBlob: Blob;
}

interface SvgToImageUrlData extends Omit<UpdateImageSymbolParams, 'imageSymbol' | 'svgBlob'> {
  id: number;
  imgHeight: number;
  imgWidth: number;
  svgUrl: string;
}

let requestId = 0;
const getRequestID = () => {
  requestId += 1;
  requestId %= 10000;

  return requestId;
};

const isSafari = getBrowser() === 'Safari';

// For debug, same as svgToImgUrlByShadowWindow
const svgToImgUrl = async (data: SvgToImageUrlData) =>
  new Promise<string>((resolve) => {
    const { fullColor, imgHeight: height, imgWidth: width, strokeWidth, svgUrl } = data;
    const roundedStrokeWidth = Math.round(strokeWidth);
    const img = new Image(width + roundedStrokeWidth, height + roundedStrokeWidth);

    img.onload = async () => {
      const imgCanvas = document.createElement('canvas');

      imgCanvas.width = img.width;
      imgCanvas.height = img.height;

      const ctx = imgCanvas.getContext('2d')!;

      ctx.imageSmoothingEnabled = false;

      if (isSafari) {
        ctx.drawImage(
          img,
          -roundedStrokeWidth,
          -roundedStrokeWidth,
          width + roundedStrokeWidth,
          height + roundedStrokeWidth,
          0,
          0,
          img.width,
          img.height,
        );
        img.remove();
      } else {
        ctx.drawImage(img, 0, 0, img.width, img.height);
      }

      const outCanvas = document.createElement('canvas');

      outCanvas.width = Math.max(1, width);
      outCanvas.height = Math.max(1, height);

      const outCtx = outCanvas.getContext('2d')!;

      outCtx.imageSmoothingEnabled = false;

      if (!fullColor) {
        outCtx.filter = 'brightness(0%)';
      }

      outCtx.drawImage(imgCanvas, 0, 0, outCanvas.width, outCanvas.height);

      if (isSafari) {
        // canvas context does not work in safari
        const imageData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] !== 0) {
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
          }
        }
        outCtx.putImageData(imageData, 0, 0);
      }

      const imageBase64 = outCanvas.toDataURL('image/png');
      const res = await fetch(imageBase64);
      const imageBlob = await res.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      resolve(imageUrl);
    };
    img.src = svgUrl;

    if (isSafari) document.body.appendChild(img);
  });

const svgToImgUrlByShadowWindow = async (data: SvgToImageUrlData) =>
  new Promise<string>((resolve) => {
    communicator.once(`${SvgEvents.SvgUrlToImgUrlDone}-${requestId}`, (_: any, url: string) => {
      resolve(url);
    });
    communicator.send(SvgEvents.SvgUrlToImgUrl, data);
  });

const getImageUrl = async ({
  bb,
  fullColor,
  imageRatio,
  imageSymbol,
  strokeWidth,
  svgBlob,
}: UpdateImageSymbolParams) => {
  const svgUrl = URL.createObjectURL(svgBlob);
  const data = {
    bb,
    fullColor,
    id: getRequestID(),
    imageRatio,
    imgHeight: Math.max(bb.height * imageRatio, 1),
    imgWidth: Math.max(bb.width * imageRatio, 1),
    strokeWidth,
    svgUrl,
  };
  const imageUrl = isWeb() ? await svgToImgUrl(data) : await svgToImgUrlByShadowWindow(data);

  URL.revokeObjectURL(svgUrl);

  return { data, imageSymbol, imageUrl };
};

const updateImageUrl = (
  imageSymbol: SVGSymbolElement,
  { bb, fullColor, strokeWidth }: SvgToImageUrlData,
  imageUrl: string,
) => {
  const image = imageSymbol.firstChild as SVGElement;
  const oldImageUrl = image.getAttribute('href');

  image.setAttribute('x', String(bb.x));
  image.setAttribute('y', String(bb.y));
  image.setAttribute('width', String(bb.width));
  image.setAttribute('height', String(bb.height));
  image.setAttribute('href', imageUrl);

  const defs = findDefs();

  if (oldImageUrl && !defs.querySelector(`image[href="${oldImageUrl}"]`)) {
    URL.revokeObjectURL(oldImageUrl);
  }

  imageSymbol.setAttribute('data-stroke-width', strokeWidth.toPrecision(6));
  imageSymbol.setAttribute('data-fullcolor', fullColor ? '1' : '0');
};

const input$ = new Subject<UpdateImageSymbolParams>();

input$
  .pipe(
    mergeMap(async (param, index) => {
      const { data, imageSymbol, imageUrl } = await getImageUrl(param);

      return { data, imageSymbol, imageUrl, index };
    }),
    scan<
      { data: SvgToImageUrlData; imageSymbol: SVGSymbolElement; imageUrl: string; index: number },
      {
        indexMap: Record<string, number>;
        res?: {
          data: SvgToImageUrlData;
          imageSymbol: SVGSymbolElement;
          imageUrl: string;
        };
      }
    >(
      ({ indexMap }, { data, imageSymbol, imageUrl, index }) => {
        const latestIndex = indexMap[imageSymbol.id] ?? -1;

        if (index > latestIndex) {
          indexMap[imageSymbol.id] = index;

          return { indexMap, res: { data, imageSymbol, imageUrl } };
        }

        URL.revokeObjectURL(imageUrl);

        return { indexMap };
      },
      { indexMap: {} },
    ),
    filter(({ res }) => res !== undefined),
    map(({ res }) => res!),
  )
  .subscribe(({ data, imageSymbol, imageUrl }) => {
    updateImageUrl(imageSymbol, data, imageUrl);
  });

export const updateImageSymbol = async (param: UpdateImageSymbolParams) => {
  input$.next(param);
};

export const waitForImageSymbolUrl = async (symbol: SVGSymbolElement): Promise<void> => {
  const image = symbol.querySelector('image') as SVGImageElement;

  if (!image) return;

  if (image.getAttribute('href')) return;

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (image.getAttribute('href')) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(image, { attributeFilter: ['href'] });
  });
};

export default updateImageSymbol;
