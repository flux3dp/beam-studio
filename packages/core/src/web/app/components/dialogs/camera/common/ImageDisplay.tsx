import type { MutableRefObject, ReactNode, SyntheticEvent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import classNames from 'classnames';

import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import useI18n from '@core/helpers/useI18n';

import styles from './ImageDisplay.module.scss';

interface Props {
  className?: string;
  displayArea?: { height: number; width: number; x: number; y: number };
  img: null | { blob: Blob; url: string };
  onDragEnd?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragMove?: (e: React.MouseEvent<HTMLDivElement>, scale: number) => boolean;
  onImgLoad?: () => void;
  onScaleChange?: (scale: number, svg: SVGSVGElement) => void;
  renderContents?: (scale: number) => ReactNode;
  zoomPoints?: Array<[number, number]>;
}

const ImageDisplay = ({
  className,
  displayArea,
  img,
  onDragEnd,
  onDragMove,
  onImgLoad,
  onScaleChange,
  ref: outRef,
  renderContents,
  zoomPoints,
}: Props & { ref?: React.Ref<HTMLDivElement> }) => {
  const lang = useI18n();
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef<number>(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageSizeRef = useRef<{ height: number; width: number }>({ height: 0, width: 0 });
  const dragStartPos = useRef<null | {
    startX: number;
    startY: number;
    x: number;
    y: number;
  }>(null);
  const zoomDelta = useRef<number>(0);
  const zoomProcess = useRef<NodeJS.Timeout | null>(null);
  const zoomCenter = useRef<null | { x: number; y: number }>(null);

  useEffect(() => {
    if (!img && imgLoaded) setImgLoaded(false);
  }, [img, imgLoaded]);

  const minScale = useMemo(() => {
    if (!imgContainerRef.current || !imgLoaded) return 0.2;

    const size = displayArea ?? imageSizeRef.current;

    return Math.min(
      imgContainerRef.current.clientWidth / size.width,
      imgContainerRef.current.clientHeight / size.height,
    );
  }, [imgLoaded, displayArea]);

  const scrollToZoomCenter = useCallback(() => {
    if (zoomCenter.current && imgContainerRef.current) {
      const { x, y } = zoomCenter.current;

      imgContainerRef.current.scrollLeft = x * scaleRef.current - imgContainerRef.current.clientWidth / 2;
      imgContainerRef.current.scrollTop = y * scaleRef.current - imgContainerRef.current.clientHeight / 2;
    }
  }, []);

  const updateScale = useCallback(
    (newValue: number, scrollToCenter = false) => {
      if (scrollToCenter && imgContainerRef.current) {
        const currentCenter = {
          x: imgContainerRef.current.scrollLeft + imgContainerRef.current.clientWidth / 2,
          y: imgContainerRef.current.scrollTop + imgContainerRef.current.clientHeight / 2,
        };

        zoomCenter.current = {
          x: currentCenter.x / scaleRef.current,
          y: currentCenter.y / scaleRef.current,
        } as { x: number; y: number };
      }

      scaleRef.current = newValue;

      const size = displayArea ?? imageSizeRef.current;

      if (size.width !== 0 && size.height !== 0) {
        const w = size.width * newValue;
        const h = size.height * newValue;

        if (imgContainerRef.current?.clientWidth! > w || imgContainerRef.current?.clientHeight! > h) {
          imgContainerRef.current?.classList.add(styles.flex);
        } else {
          imgContainerRef.current?.classList.remove(styles.flex);
        }

        if (svgRef.current) {
          svgRef.current.style.width = `${w}px`;
          svgRef.current.style.height = `${h}px`;
          onScaleChange?.(newValue, svgRef.current);
        }

        if (scrollToCenter) scrollToZoomCenter();
      }
    },
    [displayArea, scrollToZoomCenter, onScaleChange],
  );

  const handleZoom = useCallback(
    (delta: number) => {
      const cur = scaleRef.current;
      const newScale = Math.max(Math.round(Math.max(Math.min(2, cur + delta), minScale) * 10000), 1) / 10000;

      if (newScale === cur) return;

      updateScale(newScale, true);
    },
    [updateScale, minScale],
  );

  const handleZoomToPoints = useCallback(
    (targetPoints: Array<[number, number]>) => {
      const container = imgContainerRef.current;

      if (!container || !targetPoints?.length) return;

      const coord = targetPoints.reduce(
        (acc, p) => {
          acc.maxX = Math.max(acc.maxX, p[0]);
          acc.maxY = Math.max(acc.maxY, p[1]);
          acc.minX = Math.min(acc.minX, p[0]);
          acc.minY = Math.min(acc.minY, p[1]);

          return acc;
        },
        { maxX: 0, maxY: 0, minX: Infinity, minY: Infinity },
      );
      const width = coord.maxX - coord.minX;
      const height = coord.maxY - coord.minY;
      const center = [
        (coord.maxX + coord.minX) / 2 - (displayArea?.x ?? 0),
        (coord.maxY + coord.minY) / 2 - (displayArea?.y ?? 0),
      ];
      const scaleW = container.clientWidth / width;
      const scaleH = container.clientHeight / height;
      const targetScale = Math.min(scaleW, scaleH) * 0.8;

      updateScale(targetScale);
      container.scrollLeft = center[0] * targetScale - container.clientWidth / 2;
      container.scrollTop = center[1] * targetScale - container.clientHeight / 2;
    },
    [updateScale, displayArea],
  );

  const handleResetView = useCallback(() => {
    const container = imgContainerRef.current;

    if (!container) return;

    const size = displayArea ?? imageSizeRef.current;
    const targetScale = Math.max(container.clientWidth / size.width, container.clientHeight / size.height);

    updateScale(targetScale);
    container.scrollLeft = (size.width * targetScale - container.clientWidth) / 2;
    container.scrollTop = (size.height * targetScale - container.clientHeight) / 2;
  }, [displayArea, updateScale]);

  const handleImgLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      imageSizeRef.current = {
        height: e.currentTarget.naturalHeight,
        width: e.currentTarget.naturalWidth,
      };

      if (!imgLoaded) {
        setImgLoaded(true);
        onImgLoad?.();

        if (zoomPoints) handleZoomToPoints(zoomPoints);
      }
    },
    [onImgLoad, imgLoaded, zoomPoints, handleZoomToPoints],
  );

  useEffect(() => {
    if (zoomPoints?.length) handleZoomToPoints(zoomPoints);
  }, [handleZoomToPoints, zoomPoints]);

  const handleContainerDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragStartPos.current = {
      startX: e.currentTarget.scrollLeft,
      startY: e.currentTarget.scrollTop,
      x: e.screenX,
      y: e.screenY,
    };
  }, []);

  const handleDragMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onDragMove?.(e, scaleRef.current)) return;

      if (dragStartPos.current) {
        const { startX, startY, x, y } = dragStartPos.current;
        const dx = e.screenX - x;
        const dy = e.screenY - y;

        e.currentTarget.scrollLeft = startX - dx;
        e.currentTarget.scrollTop = startY - dy;
      }
    },
    [onDragMove],
  );

  const handleDragEnd = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onDragEnd?.(e);
      dragStartPos.current = null;
    },
    [onDragEnd],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // @ts-expect-error use wheelDelta if exists
      const { ctrlKey, deltaY, detail, wheelDelta } = e;
      const delta = wheelDelta ?? -detail;

      if (Math.abs(deltaY) >= 40) {
        // mouse
        e.preventDefault();
        e.stopPropagation();
      } else if (!ctrlKey) {
        return;
      }

      zoomDelta.current += delta / 12000;

      if (!zoomProcess.current) {
        zoomProcess.current = setTimeout(() => {
          if (zoomDelta.current !== 0) {
            handleZoom(zoomDelta.current);
          }

          zoomDelta.current = 0;
          zoomProcess.current = null;
        }, 20) as NodeJS.Timeout;
      }
    },
    [handleZoom],
  );

  useEffect(() => {
    const imgContainer = imgContainerRef.current;

    imgContainer?.addEventListener('wheel', handleWheel);

    return () => {
      imgContainer?.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const size = displayArea ?? imageSizeRef.current;

  return (
    <div className={classNames(styles.container, className)}>
      <div
        className={styles['img-container']}
        onMouseDown={handleContainerDragStart}
        onMouseLeave={handleDragEnd}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        ref={(node) => {
          imgContainerRef.current = node;

          if (outRef) (outRef as MutableRefObject<HTMLDivElement>).current = node!;
        }}
      >
        {!img && <Spin className={styles.spin} indicator={<LoadingOutlined className={styles.spinner} spin />} />}
        {img &&
          (!imgLoaded ? (
            <img onLoad={handleImgLoad} src={img?.url} />
          ) : (
            <svg
              height={size.height * scaleRef.current}
              ref={svgRef}
              viewBox={`${displayArea?.x ?? 0} ${displayArea?.y ?? 0} ${size.width} ${size.height}`}
              width={size.width * scaleRef.current}
            >
              <image height={imageSizeRef.current.height} href={img?.url} width={imageSizeRef.current.width} />
              {renderContents?.(scaleRef.current)}
            </svg>
          ))}
      </div>
      <div className={styles['zoom-block']}>
        <button onClick={() => handleZoom(-0.1)} type="button">
          <ObjectPanelIcons.Minus className={styles.icon} height="24" width="24" />
        </button>
        <button onClick={handleResetView}>{lang.global.editing.reset_view}</button>
        <button onClick={() => handleZoom(0.1)} type="button">
          <ObjectPanelIcons.Plus className={styles.icon} height="24" width="24" />
        </button>
      </div>
    </div>
  );
};

export default ImageDisplay;
