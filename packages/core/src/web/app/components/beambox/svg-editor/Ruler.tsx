import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import styles from './Ruler.module.scss';

const Ruler = (): React.JSX.Element => {
  const shouldShowRulers = useGlobalPreferenceStore((state) => state.show_rulers);
  const canvasEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('canvas'), []);
  const rulersRef = useRef<HTMLDivElement>(null);
  const xContainerRef = useRef<HTMLDivElement>(null);
  const yContainerRef = useRef<HTMLDivElement>(null);
  const isInch = useStorageStore((state) => state.isInch);

  const updateRulers = useCallback(() => {
    const { canvasExpansion, height, width, zoomRatio } = workareaManager;
    const canvasLimit = 3000;
    const { devicePixelRatio } = window; // Retina support
    const ratio = Math.max(devicePixelRatio, 1);
    const svgcontent = document.getElementById('svgcontent');

    if (!svgcontent) {
      return;
    }

    // big step before zoom
    const step =
      (() => {
        const size = 100 / (zoomRatio * (isInch ? 25.4 : 1));
        const digit = Math.ceil(Math.log10(size));
        const intervals = [2, 5, 10].map((x) => x * 10 ** (digit - 1));
        const interval = intervals.find((x) => x >= size);

        return interval ?? 0;
      })() * (isInch ? 25.4 : 1);
    const zoomedStep = (step * zoomRatio) / 10;

    for (let i = 0; i < 2; i += 1) {
      // draw from 0 to max
      const isX = i === 0;
      const container = isX ? xContainerRef.current : yContainerRef.current;
      const totalLen = (isX ? width : height) * zoomRatio * canvasExpansion;
      const mainDimension = isX ? 'width' : 'height';
      const subDimension = isX ? 'height' : 'width';
      const canvasCounts = Math.ceil(totalLen / canvasLimit);

      if (!container) {
        continue;
      }

      container.innerHTML = '';
      container.style[mainDimension] = `${totalLen}px`;

      const contentPosition = Number(svgcontent.getAttribute(isX ? 'x' : 'y'));

      if (Number.isNaN(contentPosition)) {
        continue;
      }

      // Create Canvas
      const rulerCanvases = Array.from({ length: canvasCounts }).map((_, idx) => {
        const canvas = document.createElement('canvas');
        const mainLength = idx < canvasCounts - 1 ? canvasLimit : totalLen % canvasLimit;
        const subLength = 15;

        canvas.style[mainDimension] = `${mainLength}px`;
        canvas.style[subDimension] = `${subLength}px`;
        canvas[mainDimension] = mainLength * ratio;
        canvas[subDimension] = subLength * ratio;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        ctx.scale(ratio, ratio);
        ctx.fillStyle = '#333';
        ctx.strokeStyle = '#000';
        ctx.font = '12px sans-serif';
        container.appendChild(canvas);

        return canvas;
      });
      const ctxs = rulerCanvases.map((canvas) => canvas.getContext('2d'));
      const start = Math.ceil(contentPosition / zoomedStep);
      const end = (totalLen - contentPosition) / zoomedStep;

      for (let j = -start; j < end; j += 1) {
        const zoomedPos = contentPosition + j * zoomedStep;
        const canvasIdx = Math.floor(zoomedPos / canvasLimit);

        if (canvasIdx < 0 || canvasIdx >= canvasCounts) {
          continue;
        }

        const ctx = ctxs[canvasIdx] as CanvasRenderingContext2D;
        const canvasPos = zoomedPos % canvasLimit;

        if (j % 10 === 0) {
          // big step
          if (isX) {
            // X axis
            ctx.moveTo(canvasPos, 0);
            ctx.lineTo(canvasPos, 15);
          } else {
            // Y axis
            ctx.moveTo(0, canvasPos);
            ctx.lineTo(15, canvasPos);
          }

          const realPos = (j * step) / 100 / (isInch ? 25.4 : 1);
          let label: string;

          if (step / (isInch ? 25.4 : 1) >= 10) {
            label = realPos.toFixed(0);
          } else {
            const decimalPlace = String(step / 10).split('.')[1].length;

            label = realPos.toFixed(decimalPlace);
          }

          if (label.endsWith('000') && !label.includes('.')) {
            label = `${label.slice(0, -3)}K`;
          }

          if (isX) {
            ctx.fillText(label, canvasPos + 2, 10);
          } else {
            ctx.save();
            ctx.translate(10, canvasPos + 2);
            ctx.textAlign = 'right';
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(label, 0, 0);
            ctx.restore();
          }
        } else {
          const lineSize = j % 2 ? 12 : 10;

          if (isX) {
            // X axis
            ctx.moveTo(canvasPos, 15);
            ctx.lineTo(canvasPos, lineSize);
          } else {
            // Y axis
            ctx.moveTo(15, canvasPos);
            ctx.lineTo(lineSize, canvasPos);
          }
        }
      }
      ctxs.forEach((ctx) => ctx?.stroke());
    }

    const workArea = document.getElementById('workarea');

    if (workArea) {
      if (xContainerRef.current?.parentNode) {
        (xContainerRef.current.parentNode as Element).scrollLeft = workArea.scrollLeft;
      }

      if (yContainerRef.current?.parentNode) {
        (yContainerRef.current.parentNode as Element).scrollTop = workArea.scrollTop;
      }
    }
  }, [isInch]);

  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(updateRulers);
    };

    if (shouldShowRulers) {
      handler();
      canvasEventEmitter.on('zoom-changed', handler);

      return () => {
        canvasEventEmitter.off('zoom-changed', handler);
      };
    }

    return () => {};
  }, [shouldShowRulers, canvasEventEmitter, updateRulers]);

  return (
    <div className={styles.rulers} id="rulers" ref={rulersRef} style={{ display: shouldShowRulers ? '' : 'none' }}>
      <div className={styles.corner} />
      <div className={styles.x} id="ruler_x">
        <div className={styles.container} ref={xContainerRef} />
      </div>
      <div className={styles.y} id="ruler_y">
        <div className={styles.container} ref={yContainerRef} />
      </div>
      <div className={styles.unit}>{isInch ? 'inch' : 'mm'}</div>
    </div>
  );
};

export default Ruler;
