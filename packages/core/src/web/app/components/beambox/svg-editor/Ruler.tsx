import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import storage from 'implementations/storage';
import workareaManager from 'app/svgedit/workarea';

import styles from './Ruler.module.scss';

const Ruler = (): JSX.Element => {
  const showShowRulers = !!beamboxPreference.read('show_rulers');
  const canvasEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('canvas'), []);
  const rulersRef = useRef<HTMLDivElement>(null);
  const xContainerRef = useRef<HTMLDivElement>(null);
  const yContainerRef = useRef<HTMLDivElement>(null);
  const unit = storage.get('default-units');

  const updateRulers = useCallback(() => {
    const { canvasExpansion, width, height, zoomRatio } = workareaManager;
    const canvasLimit = 3000;
    const { devicePixelRatio } = window; // Retina support
    const ratio = Math.max(devicePixelRatio, 1);
    const svgcontent = document.getElementById('svgcontent');
    if (!svgcontent) return;
    const isInch = unit === 'inches';
    // big step before zoom
    const step =
      (() => {
        const size = 100 / (zoomRatio * (isInch ? 25.4 : 1));
        const digit = Math.ceil(Math.log10(size));
        const intervals = [2, 5, 10].map((x) => x * 10 ** (digit - 1));
        const interval = intervals.find((x) => x >= size);
        return interval;
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
      // eslint-disable-next-line no-continue
      if (!container) continue;
      container.innerHTML = '';
      container.style[mainDimension] = `${totalLen}px`;
      const contentPosition = Number(svgcontent.getAttribute(isX ? 'x' : 'y'));
      // eslint-disable-next-line no-continue
      if (Number.isNaN(contentPosition)) continue;
      // Create Canvas
      const rulerCanvases = Array.from({ length: canvasCounts }).map((_, idx) => {
        const canvas = document.createElement('canvas');
        const mainLength = idx < canvasCounts - 1 ? canvasLimit : totalLen % canvasLimit;
        const subLength = 15;
        canvas.style[mainDimension] = `${mainLength}px`;
        canvas.style[subDimension] = `${subLength}px`;
        canvas[mainDimension] = mainLength * ratio;
        canvas[subDimension] = subLength * ratio;
        const ctx = canvas.getContext('2d');
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
        // eslint-disable-next-line no-continue
        if (canvasIdx < 0 || canvasIdx >= canvasCounts) continue;
        const ctx = ctxs[canvasIdx];
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
          if (label.endsWith('000') && !label.includes('.')) label = `${label.slice(0, -3)}K`;
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
      ctxs.forEach((ctx) => ctx.stroke());
    }
    const workArea = document.getElementById('workarea');
    if (workArea) {
      if (xContainerRef.current?.parentNode)
        (xContainerRef.current.parentNode as Element).scrollLeft = workArea.scrollLeft;
      if (yContainerRef.current?.parentNode)
        (yContainerRef.current.parentNode as Element).scrollTop = workArea.scrollTop;
    }
  }, [unit]);

  useEffect(() => {
    const handler = () => {
      const shouldShowRulers = !!beamboxPreference.read('show_rulers');
      rulersRef.current?.style.setProperty('display', shouldShowRulers ? '' : 'none');
      if (shouldShowRulers) requestAnimationFrame(() => updateRulers());
    };
    handler();
    canvasEventEmitter.on('update-ruler', handler);
    canvasEventEmitter.on('zoom-changed', handler);
    return () => {
      canvasEventEmitter.off('update-ruler', handler);
      canvasEventEmitter.off('zoom-changed', handler);
    };
  }, [canvasEventEmitter, updateRulers]);

  return (
    <div ref={rulersRef} id="rulers" className={styles.rulers} style={{ display: showShowRulers ? '' : 'none' }}>
      <div className={styles.corner} />
      <div id="ruler_x" className={styles.x}>
        <div ref={xContainerRef} className={styles.container} />
      </div>
      <div id="ruler_y" className={styles.y}>
        <div ref={yContainerRef} className={styles.container} />
      </div>
      <div className={styles.unit}>{unit === 'inches' ? 'inch' : 'mm'}</div>
    </div>
  );
};
export default Ruler;
