import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import progressCaller from '@core/app/actions/progress-caller';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import { useSetState } from '@core/helpers/hooks/useSetState';
import calculateBase64 from '@core/helpers/image-edit-panel/calculate-base64';
import jimpHelper from '@core/helpers/jimp-helper';
import useI18n from '@core/helpers/useI18n';
import imageProcessor from '@core/implementations/imageProcessor';

export type ImageEditState = {
  displaySrc: string;
  imageHeight: number;
  imageWidth: number;
  isShowingOriginal?: boolean;
  origHeight: number;
  origWidth: number;
  previewSrc: string;
};

export const useImageEdit = (element: SVGElement, src: string) => {
  const t = useI18n().beambox.photo_edit_panel;
  const [state, setState] = useSetState<ImageEditState>({
    displaySrc: src,
    imageHeight: 0,
    imageWidth: 0,
    isShowingOriginal: false,
    origHeight: 0,
    origWidth: 0,
    previewSrc: src,
  });
  const compareBase64 = useRef('');
  const [displayBase64, setDisplayBase64] = useState<string>('');
  const { isFullColor, shading, threshold } = useMemo(
    () => ({
      isFullColor: element.getAttribute('data-fullcolor') === '1',
      shading: element.getAttribute('data-shading') === 'true',
      threshold: Number.parseInt(element.getAttribute('data-threshold') || '128', 10),
    }),
    [element],
  );

  useEffect(
    () => () => {
      if (state.displaySrc !== state.previewSrc) {
        URL.revokeObjectURL(state.displaySrc);
      }
    },
    [state.displaySrc, state.previewSrc],
  );

  useEffect(
    () => () => {
      if (state.previewSrc !== src) {
        URL.revokeObjectURL(state.previewSrc);
      }
    },
    [state.previewSrc, src],
  );

  const calculateImageData = useCallback(
    async (src: string): Promise<string> => {
      const resultBase64 = await calculateBase64(src, shading, threshold, isFullColor);

      return resultBase64;
    },
    [shading, threshold, isFullColor],
  );

  useEffect(() => {
    const preprocess = async () => {
      const setCompareBase64 = async (imgUrl: string) => {
        const result = await calculateImageData(imgUrl);

        compareBase64.current = result;
      };

      progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });
      await new Promise((resolve) => setTimeout(resolve, 100)); // show progress

      let imgBlobUrl = src;

      try {
        const image = await jimpHelper.urlToImage(imgBlobUrl);
        const { height: origHeight, width: origWidth } = image.bitmap;

        if (Math.max(origWidth, origHeight) > 600) {
          if (origWidth >= origHeight) {
            image.resize(600, imageProcessor.AUTO);
          } else {
            image.resize(imageProcessor.AUTO, 600);
          }

          console.log(
            `useImageCompare.ts: Resized image from ${origWidth} x ${origHeight} to ${image.bitmap.width} x ${image.bitmap.height}`,
          );

          imgBlobUrl = await jimpHelper.imageToUrl(image);
        }

        setCompareBase64(imgBlobUrl);
        setState({
          displaySrc: imgBlobUrl,
          imageHeight: image.bitmap.height,
          imageWidth: image.bitmap.width,
          origHeight,
          origWidth,
          previewSrc: imgBlobUrl,
        });
      } catch (err) {
        console.log(err);
      } finally {
        progressCaller.popById('photo-edit-processing');
      }
    };

    preprocess();

    return () => {
      ObjectPanelController.updateActiveKey(null);
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const generateDisplayBase64 = async () => {
      if (state.displaySrc) {
        const result = await calculateImageData(state.displaySrc);

        setDisplayBase64(result);
      }
    };

    generateDisplayBase64();
  }, [state.displaySrc, calculateImageData]);

  return {
    calculateImageData,
    compareBase64: compareBase64.current,
    displayBase64,
    setState,
    state,
  };
};
